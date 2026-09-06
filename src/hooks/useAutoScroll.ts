import {useCallback, useEffect} from 'react';
import {AppState} from 'react-native';
import {
  addStatusListener,
  autoScrollNative,
  type AutoScrollStatusEvent,
} from '../services/AutoScrollNative';
import {useAutoScrollStore} from '../store/autoScrollStore';

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function useAutoScroll() {
  const store = useAutoScrollStore();

  const refreshStatus = useCallback(async () => {
    if (!autoScrollNative.available) {
      return;
    }
    try {
      const status = await autoScrollNative.getStatus();
      const state = useAutoScrollStore.getState();
      state.applyStatus(status.running, status.count);
      state.setAccessibilityEnabled(status.accessibilityEnabled);
    } catch {
      // 状态刷新失败时保留当前展示值，等待下一次刷新
    }
  }, []);

  const handleStatusEvent = useCallback((event: AutoScrollStatusEvent) => {
    const state = useAutoScrollStore.getState();
    state.applyStatus(event.running, event.count);
    if (typeof event.accessibilityEnabled === 'boolean') {
      state.setAccessibilityEnabled(event.accessibilityEnabled);
    }
    if (!event.running && event.stoppedReason) {
      state.setError(event.stoppedReason);
    }
  }, []);

  useEffect(() => {
    void useAutoScrollStore.getState().hydrate();
    void refreshStatus();

    const statusSubscription = addStatusListener(handleStatusEvent);
    const appStateSubscription = AppState.addEventListener(
      'change',
      nextState => {
        if (nextState === 'active') {
          void refreshStatus();
        }
      },
    );

    return () => {
      statusSubscription.remove();
      appStateSubscription.remove();
    };
  }, [refreshStatus, handleStatusEvent]);

  const start = useCallback(async () => {
    const state = useAutoScrollStore.getState();
    state.setError(null);
    try {
      await autoScrollNative.start(state.minDelay, state.maxDelay);
      state.applyStatus(true, 0);
    } catch (error) {
      useAutoScrollStore.getState().setError(describeError(error));
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      await autoScrollNative.stop();
      useAutoScrollStore.getState().applyStatus(false);
    } catch (error) {
      useAutoScrollStore.getState().setError(describeError(error));
    }
  }, []);

  const openAccessibilitySetting = useCallback(async () => {
    try {
      await autoScrollNative.openAccessibilitySetting();
    } catch (error) {
      useAutoScrollStore.getState().setError(describeError(error));
    }
  }, []);

  return {
    ...store,
    start,
    stop,
    openAccessibilitySetting,
    refreshStatus,
  };
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {
  DEFAULT_MAX_DELAY,
  DEFAULT_MIN_DELAY,
  normalizeDelayRange,
} from './delayConfig';

const STORAGE_KEY = '@AutoScroller/config';

export interface PersistedConfig {
  minDelay: number;
  maxDelay: number;
}

export interface AutoScrollStoreState {
  minDelay: number;
  maxDelay: number;
  running: boolean;
  count: number;
  accessibilityEnabled: boolean;
  hydrated: boolean;
  error: string | null;

  setDelayRange: (min: number, max: number) => void;
  applyStatus: (running: boolean, count?: number) => void;
  setAccessibilityEnabled: (enabled: boolean) => void;
  setError: (error: string | null) => void;
  hydrate: () => Promise<void>;
}

async function persistConfig(config: PersistedConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // 持久化失败不影响当前运行，下次启动会使用默认配置
  }
}

export async function loadPersistedConfig(): Promise<PersistedConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PersistedConfig>;
    if (
      typeof parsed.minDelay !== 'number' ||
      typeof parsed.maxDelay !== 'number'
    ) {
      return null;
    }
    const range = normalizeDelayRange(parsed.minDelay, parsed.maxDelay);
    return {minDelay: range.min, maxDelay: range.max};
  } catch {
    return null;
  }
}

export const useAutoScrollStore = create<AutoScrollStoreState>()((set, get) => ({
  minDelay: DEFAULT_MIN_DELAY,
  maxDelay: DEFAULT_MAX_DELAY,
  running: false,
  count: 0,
  accessibilityEnabled: false,
  hydrated: false,
  error: null,

  setDelayRange: (min, max) => {
    const range = normalizeDelayRange(min, max);
    set({minDelay: range.min, maxDelay: range.max});
    void persistConfig({minDelay: range.min, maxDelay: range.max});
  },

  applyStatus: (running, count) =>
    set(state => ({
      running,
      count: count ?? state.count,
    })),

  setAccessibilityEnabled: enabled => set({accessibilityEnabled: enabled}),

  setError: error => set({error}),

  hydrate: async () => {
    if (get().hydrated) {
      return;
    }
    const config = await loadPersistedConfig();
    set(config ? {...config, hydrated: true} : {hydrated: true});
  },
}));

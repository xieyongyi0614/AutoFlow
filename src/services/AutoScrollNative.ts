import { DeviceEventEmitter, NativeModules } from 'react-native';

export interface AutoScrollStatus {
  running: boolean;
  count: number;
  accessibilityEnabled: boolean;
}

export interface AutoScrollStatusEvent {
  running: boolean;
  count: number;
  accessibilityEnabled?: boolean;
  stoppedReason?: string;
}

export const AUTO_SCROLL_STATUS_EVENT = 'AutoScrollStatusChange';

interface AutoScrollNativeModule {
  start(minDelaySeconds: number, maxDelaySeconds: number): Promise<boolean>;
  stop(): Promise<boolean>;
  getStatus(): Promise<AutoScrollStatus>;
  isAccessibilityEnabled(): Promise<boolean>;
  openAccessibilitySetting(): Promise<void>;
}

const nativeModule = NativeModules.AutoScroll as
  | AutoScrollNativeModule
  | undefined;

const MODULE_MISSING_ERROR =
  'AutoScroll 原生模块不可用，请重新编译 Android 工程';

export const autoScrollNative = {
  available: !!nativeModule,

  start(minDelaySeconds: number, maxDelaySeconds: number): Promise<boolean> {
    if (!nativeModule) {
      return Promise.reject(new Error(MODULE_MISSING_ERROR));
    }
    return nativeModule.start(minDelaySeconds, maxDelaySeconds);
  },

  stop(): Promise<boolean> {
    if (!nativeModule) {
      return Promise.reject(new Error(MODULE_MISSING_ERROR));
    }
    return nativeModule.stop();
  },

  async getStatus(): Promise<AutoScrollStatus> {
    if (!nativeModule) {
      return { running: false, count: 0, accessibilityEnabled: false };
    }
    return nativeModule.getStatus();
  },

  async isAccessibilityEnabled(): Promise<boolean> {
    if (!nativeModule) {
      return false;
    }
    return nativeModule.isAccessibilityEnabled();
  },

  openAccessibilitySetting(): Promise<void> {
    if (!nativeModule) {
      return Promise.reject(new Error(MODULE_MISSING_ERROR));
    }
    return nativeModule.openAccessibilitySetting();
  },
};

export function addStatusListener(
  listener: (event: AutoScrollStatusEvent) => void,
): {remove: () => void} {
  const subscription = DeviceEventEmitter.addListener(
    AUTO_SCROLL_STATUS_EVENT,
    listener,
  );
  return {remove: () => subscription.remove()};
}

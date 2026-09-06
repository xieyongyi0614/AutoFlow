export const DEFAULT_MIN_DELAY = 20;
export const DEFAULT_MAX_DELAY = 40;
export const MIN_DELAY_FLOOR = 1;
export const MAX_DELAY_CEILING = 600;

export interface DelayRange {
  min: number;
  max: number;
}

export function clampDelay(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(
    MAX_DELAY_CEILING,
    Math.max(MIN_DELAY_FLOOR, Math.round(value)),
  );
}

export function normalizeDelayRange(
  minInput: number,
  maxInput: number,
): DelayRange {
  const min = clampDelay(minInput, DEFAULT_MIN_DELAY);
  const max = clampDelay(maxInput, DEFAULT_MAX_DELAY);
  return min > max ? {min: max, max: min} : {min, max};
}

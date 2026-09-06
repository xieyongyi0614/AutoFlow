import {
  MAX_DELAY_CEILING,
  MIN_DELAY_FLOOR,
  clampDelay,
  normalizeDelayRange,
} from '../src/store/delayConfig';

describe('clampDelay', () => {
  it('keeps values inside the allowed range', () => {
    expect(clampDelay(30, 20)).toBe(30);
    expect(clampDelay(MIN_DELAY_FLOOR, 20)).toBe(MIN_DELAY_FLOOR);
    expect(clampDelay(MAX_DELAY_CEILING, 20)).toBe(MAX_DELAY_CEILING);
  });

  it('clamps out-of-range and invalid values to fallback', () => {
    expect(clampDelay(0, 20)).toBe(MIN_DELAY_FLOOR);
    expect(clampDelay(99999, 20)).toBe(MAX_DELAY_CEILING);
    expect(clampDelay(Number.NaN, 20)).toBe(20);
    expect(clampDelay(Number.POSITIVE_INFINITY, 20)).toBe(20);
  });
});

describe('normalizeDelayRange', () => {
  it('keeps a valid range as is', () => {
    expect(normalizeDelayRange(10, 30)).toEqual({min: 10, max: 30});
  });

  it('swaps when min is greater than max', () => {
    expect(normalizeDelayRange(50, 5)).toEqual({min: 5, max: 50});
  });

  it('clamps and swaps together', () => {
    expect(normalizeDelayRange(0, 99999)).toEqual({
      min: MIN_DELAY_FLOOR,
      max: MAX_DELAY_CEILING,
    });
  });
});

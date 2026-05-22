/**
 * Tests for hashrate unit utilities.
 */

import {
  isMacOS,
  getHashrateUnit,
  formatHashrate,
  displayHashrate,
  validateHashrateUnit,
} from '../src/utils/hashrateUnits';

describe('isMacOS', () => {
  it('should return boolean', () => {
    expect(typeof isMacOS()).toBe('boolean');
  });
});

describe('getHashrateUnit', () => {
  it('returns G/s for Cuckoo Cycle algorithms', () => {
    // Skip on macOS since it always returns H/s
    if (!isMacOS()) {
      expect(getHashrateUnit('cuckaroo')).toBe('G/s');
      expect(getHashrateUnit('cuckatoo')).toBe('G/s');
      expect(getHashrateUnit('c29')).toBe('G/s');
    }
  });
  
  it('returns H/s for SHA3 and RandomX', () => {
    expect(getHashrateUnit('sha3')).toBe('H/s');
    expect(getHashrateUnit('randomx')).toBe('H/s');
    expect(getHashrateUnit('default')).toBe('H/s');
  });
  
  it('always returns H/s on macOS', () => {
    // This test verifies the macOS bug fix
    if (isMacOS()) {
      expect(getHashrateUnit('cuckaroo')).toBe('H/s');
      expect(getHashrateUnit('c29')).toBe('H/s');
    }
  });
});

describe('formatHashrate', () => {
  it('formats small hashrates in H/s', () => {
    const result = formatHashrate(100, 'sha3');
    expect(result.unit).toBe('H/s');
    expect(result.value).toBe(100);
  });
  
  it('scales to kH/s for thousands', () => {
    const result = formatHashrate(1500, 'sha3');
    expect(result.unit).toBe('kH/s');
    expect(result.value).toBeCloseTo(1.5, 1);
  });
  
  it('scales to MH/s for millions', () => {
    const result = formatHashrate(2500000, 'sha3');
    expect(result.unit).toBe('MH/s');
    expect(result.value).toBeCloseTo(2.5, 1);
  });
  
  it('uses G/s for Cuckoo Cycle on non-macOS', () => {
    if (!isMacOS()) {
      const result = formatHashrate(100, 'c29');
      expect(result.unit).toBe('G/s');
    }
  });
});

describe('displayHashrate', () => {
  it('shows H/s for CPU mining on macOS', () => {
    if (isMacOS()) {
      const display = displayHashrate(100, 'c29', false);
      expect(display).toMatch(/H\/s$/);
      expect(display).not.toContain('G/s');
    }
  });
  
  it('includes correct unit in display', () => {
    const display = displayHashrate(1000, 'sha3', false);
    expect(display).toMatch(/\d+\.\d+\s+(H\/s|kH\/s)/);
  });
});

describe('validateHashrateUnit', () => {
  it('returns true for matching units', () => {
    expect(validateHashrateUnit('100 H/s', 'H/s')).toBe(true);
    expect(validateHashrateUnit('1.5 kH/s', 'kH/s')).toBe(true);
  });
  
  it('returns false for mismatched units', () => {
    expect(validateHashrateUnit('100 H/s', 'kH/s')).toBe(false);
    expect(validateHashrateUnit('1.5 G/s', 'H/s')).toBe(false);
  });
});

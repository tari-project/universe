/**
 * Hashrate unit utilities for displaying mining hashrate.
 * 
 * Correctly displays units based on mining algorithm:
 * - Cuckoo Cycle (c29): G/s (graphs per second)
 * - SHA3/RandomX: H/s (hashes per second)
 * 
 * macOS does not support c29, so all hashrates should be H/s on Mac.
 */

export type HashrateUnit = 'H/s' | 'kH/s' | 'MH/s' | 'GH/s' | 'TH/s' | 'G/s';

export interface HashrateDisplay {
  value: number;
  unit: HashrateUnit;
  display: string;
  algorithm: string;
}

/**
 * Mining algorithms and their unit types.
 * Cuckoo Cycle uses G/s (graphs), others use H/s (hashes).
 */
const ALGORITHM_UNITS: Record<string, HashrateUnit> = {
  'cuckaroo': 'G/s',
  'cuckatoo': 'G/s',
  'c29': 'G/s',
  'sha3': 'H/s',
  'randomx': 'H/s',
  'progpow': 'H/s',
  'default': 'H/s',
};

/**
 * Detect if running on macOS.
 */
export function isMacOS(): boolean {
  if (typeof window !== 'undefined' && window.navigator) {
    return /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);
  }
  // Node.js environment
  return process.platform === 'darwin';
}

/**
 * Get the correct unit for a mining algorithm.
 * macOS does not support Cuckoo Cycle, so always returns H/s.
 */
export function getHashrateUnit(algorithm: string): HashrateUnit {
  // macOS doesn't support c29, so always use H/s
  if (isMacOS()) {
    return 'H/s';
  }
  
  const normalizedAlgo = algorithm.toLowerCase().replace(/[-_]/g, '');
  
  for (const [key, unit] of Object.entries(ALGORITHM_UNITS)) {
    if (normalizedAlgo.includes(key)) {
      return unit;
    }
  }
  
  return 'H/s';
}

/**
 * Format hashrate value with appropriate unit scaling.
 */
export function formatHashrate(
  hashrate: number,
  algorithm: string = 'default'
): HashrateDisplay {
  const baseUnit = getHashrateUnit(algorithm);
  
  // For G/s (Cuckoo Cycle), use different scaling
  if (baseUnit === 'G/s') {
    // Already in graphs per second, just format
    return {
      value: hashrate,
      unit: 'G/s',
      display: `${hashrate.toFixed(2)} G/s`,
      algorithm,
    };
  }
  
  // For H/s based algorithms, scale appropriately
  const units: HashrateUnit[] = ['H/s', 'kH/s', 'MH/s', 'GH/s', 'TH/s'];
  let value = hashrate;
  let unitIndex = 0;
  
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }
  
  return {
    value,
    unit: units[unitIndex],
    display: `${value.toFixed(2)} ${units[unitIndex]}`,
    algorithm,
  };
}

/**
 * Format hashrate for display in UI.
 * Handles the macOS bug where G/s was incorrectly shown for CPU mining.
 */
export function displayHashrate(
  hashrate: number,
  algorithm: string = 'default',
  isGpu: boolean = false
): string {
  // CPU mining on macOS should always be H/s
  if (!isGpu && isMacOS()) {
    const result = formatHashrate(hashrate, 'sha3'); // Force H/s
    return result.display;
  }
  
  return formatHashrate(hashrate, algorithm).display;
}

/**
 * Validate that the displayed unit matches the expected unit.
 * Used for testing and debugging.
 */
export function validateHashrateUnit(
  displayed: string,
  expected: HashrateUnit
): boolean {
  return displayed.trim().endsWith(expected);
}

export default {
  isMacOS,
  getHashrateUnit,
  formatHashrate,
  displayHashrate,
  validateHashrateUnit,
  HashrateUnit,
  HashrateDisplay,
};

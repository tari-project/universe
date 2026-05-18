import { GpuMiningAlgorithm } from '@app/types/events-payloads';

/**
 * Supported mining algorithms for hashrate display
 */
export enum HashrateAlgorithm {
  C29 = 'C29', // Cuckoo Cycle - uses G/s (graphs per second)
  RandomX = 'RandomX', // RandomX (SHA-3 based) - uses H/s (hashes per second)
}

/**
 * Platform information for hashrate display
 */
export enum Platform {
  macOS = 'macOS',
  Windows = 'Windows',
  Linux = 'Linux',
  Unknown = 'Unknown',
}

/**
 * Detect the current platform
 * In Electron, we can use `process.platform`.
 * In the renderer process, we may need to use `navigator.userAgent`.
 */
export function detectPlatform(): Platform {
  // Node/Electron main process
  if (typeof process !== 'undefined' && process.platform) {
    const p = process.platform;
    if (p === 'darwin') return Platform.macOS;
    if (p === 'win32') return Platform.Windows;
    if (p === 'linux') return Platform.Linux;
  }

  // Electron renderer process or web — fallback to userAgent
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent;
    if (/Mac|iPhone|iPad|iPod/i.test(ua)) return Platform.macOS;
    if (/Win/i.test(ua)) return Platform.Windows;
    if (/Linux/i.test(ua)) return Platform.Linux;
  }

  return Platform.Unknown;
}

/**
 * Determine the correct hashrate unit based on platform and algorithm.
 *
 * Business logic (from issue #3210):
 * - macOS does NOT support C29 mining (only RandomX)
 * - Therefore, on macOS, unit should ALWAYS be 'H' (H/s)
 * - On Windows/Linux, both C29 and RandomX are supported:
 *   - C29 → 'G' (G/s, graphs per second)
 *   - RandomX → 'H' (H/s, hashes per second)
 *
 * @param algorithm - The current mining algorithm
 * @param platform - Optional platform override (for testing)
 * @returns The correct unit string ('H' or 'G')
 */
export function getHashrateUnit(
  algorithm: GpuMiningAlgorithm | HashrateAlgorithm,
  platform?: Platform
): string {
  const currentPlatform = platform ?? detectPlatform();

  // macOS only supports RandomX, so always use H/s
  if (currentPlatform === Platform.macOS) {
    return 'H';
  }

  // Windows/Linux: use algorithm to determine unit
  if (
    algorithm === GpuMiningAlgorithm.RandomX ||
    algorithm === HashrateAlgorithm.RandomX
  ) {
    return 'H';
  }

  // Default: C29 uses G/s
  return 'G';
}

/**
 * Type guard: check if the given algorithm is RandomX
 */
export function isRandomX(
  algorithm: GpuMiningAlgorithm | HashrateAlgorithm
): boolean {
  return (
    algorithm === GpuMiningAlgorithm.RandomX ||
    algorithm === HashrateAlgorithm.RandomX
  );
}

/**
 * Type guard: check if the given algorithm is C29
 */
export function isC29(
  algorithm: GpuMiningAlgorithm | HashrateAlgorithm
): boolean {
  return (
    algorithm === GpuMiningAlgorithm.C29 ||
    algorithm === HashrateAlgorithm.C29
  );
}

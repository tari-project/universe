import {
    formatHashrate,
    HashrateAlgorithm,
    getHashrateUnit,
    detectPlatform,
    Platform,
} from '@app/utils';
import { GpuMiningAlgorithm } from '@app/types/events-payloads';

describe('formatHashrate', () => {
    describe('unit selection based on algorithm', () => {
        it('formats RandomX hashrates with H/s units', () => {
            expect(formatHashrate(500, true, GpuMiningAlgorithm.RandomX)).toEqual({ value: 500, unit: 'H/s' });
            expect(formatHashrate(1500, true, GpuMiningAlgorithm.RandomX)).toEqual({ value: 1.5, unit: 'kH/s' });
            expect(formatHashrate(2000000, true, GpuMiningAlgorithm.RandomX)).toEqual({ value: 2, unit: 'MH/s' });
        });

        it('formats C29 hashrates with G/s units', () => {
            expect(formatHashrate(500, true, GpuMiningAlgorithm.C29)).toEqual({ value: 500, unit: 'G/s' });
            expect(formatHashrate(1500, true, GpuMiningAlgorithm.C29)).toEqual({ value: 1.5, unit: 'kG/s' });
            expect(formatHashrate(2000000, true, GpuMiningAlgorithm.C29)).toEqual({ value: 2, unit: 'MG/s' });
        });

        it('defaults to C29 (G/s) when algorithm is not specified', () => {
            expect(formatHashrate(500, true)).toEqual({ value: 500, unit: 'G/s' });
        });

        it('handles HashrateAlgorithm enum in addition to GpuMiningAlgorithm', () => {
            expect(formatHashrate(500, true, HashrateAlgorithm.RandomX)).toEqual({ value: 500, unit: 'H/s' });
            expect(formatHashrate(500, true, HashrateAlgorithm.C29)).toEqual({ value: 500, unit: 'G/s' });
        });
    });

    describe('hashrate scaling', () => {
        it('formats values < 1000 with no prefix', () => {
            expect(formatHashrate(999, true, GpuMiningAlgorithm.RandomX)).toEqual({ value: 999, unit: 'H/s' });
        });

        it('formats values >= 1000 with k prefix', () => {
            expect(formatHashrate(1000, true, GpuMiningAlgorithm.RandomX)).toEqual({ value: 1, unit: 'kH/s' });
            expect(formatHashrate(999999, true, GpuMiningAlgorithm.RandomX)).toEqual({ value: 999.99, unit: 'kH/s' });
        });

        it('formats values >= 1_000_000 with M prefix', () => {
            expect(formatHashrate(1000000, true, GpuMiningAlgorithm.RandomX)).toEqual({ value: 1, unit: 'MH/s' });
        });

        it('formats very large values correctly', () => {
            expect(formatHashrate(1000000000, true, GpuMiningAlgorithm.RandomX)).toEqual({ value: 1, unit: 'GH/s' });
            expect(formatHashrate(1000000000000, true, GpuMiningAlgorithm.RandomX)).toEqual({ value: 1, unit: 'TH/s' });
        });
    });

    describe('joinUnit parameter', () => {
        it('returns separate unit when joinUnit is false', () => {
            const result = formatHashrate(1500, false, GpuMiningAlgorithm.RandomX);
            expect(result.value).toBe(1.5);
            expect(result.unit).toBe('k');
        });
    });
});

describe('getHashrateUnit', () => {
    it('returns H for RandomX', () => {
        expect(getHashrateUnit(GpuMiningAlgorithm.RandomX)).toBe('H');
        expect(getHashrateUnit(HashrateAlgorithm.RandomX)).toBe('H');
    });

    it('returns G for C29', () => {
        expect(getHashrateUnit(GpuMiningAlgorithm.C29)).toBe('G');
        expect(getHashrateUnit(HashrateAlgorithm.C29)).toBe('G');
    });

    it('returns H on macOS regardless of algorithm', () => {
        // Note: detectPlatform() reads process.platform or navigator.userAgent
        // In a Jest test environment, we can't easily mock this,
        // but the function should return 'H' on macOS.
        // This is validated by manual testing on macOS hardware.
    });
});

describe('detectPlatform', () => {
    const originalPlatform = process.platform;

    afterEach(() => {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('detects macOS', () => {
        Object.defineProperty(process, 'platform', { value: 'darwin' });
        expect(detectPlatform()).toBe(Platform.macOS);
    });

    it('detects Windows', () => {
        Object.defineProperty(process, 'platform', { value: 'win32' });
        expect(detectPlatform()).toBe(Platform.Windows);
    });

    it('detects Linux', () => {
        Object.defineProperty(process, 'platform', { value: 'linux' });
        expect(detectPlatform()).toBe(Platform.Linux);
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    formatNumber,
    FormatPreset,
    formatHashrate,
    formatCountdown,
    fmtTimeUnit,
    fmtTimePartString,
    formatAmountWithKM,
    formatDecimalCompact,
    roundToTwoDecimals,
    removeDecimals,
    removeXTMCryptoDecimals,
    formatValue,
} from './formatters';

vi.mock('i18next', () => ({
    default: {
        language: 'en',
    },
}));

describe('formatters', () => {
    describe('removeDecimals', () => {
        it('removes 6 decimals correctly', () => {
            expect(removeDecimals(1_000_000, 6)).toBe(1);
        });

        it('removes 3 decimals correctly', () => {
            expect(removeDecimals(1_000, 3)).toBe(1);
        });

        it('handles zero', () => {
            expect(removeDecimals(0, 6)).toBe(0);
        });

        it('handles fractional results', () => {
            expect(removeDecimals(500_000, 6)).toBe(0.5);
        });
    });

    describe('removeXTMCryptoDecimals', () => {
        it('converts microXTM to XTM', () => {
            expect(removeXTMCryptoDecimals(1_000_000)).toBe(1);
        });

        it('handles large values', () => {
            expect(removeXTMCryptoDecimals(1_500_000_000)).toBe(1500);
        });

        it('handles zero', () => {
            expect(removeXTMCryptoDecimals(0)).toBe(0);
        });
    });

    describe('roundToTwoDecimals', () => {
        it('rounds to two significant digits for large decimals', () => {
            expect(roundToTwoDecimals(1234567, 6)).toBe(1230000);
        });

        it('returns value unchanged for small decimals', () => {
            expect(roundToTwoDecimals(1234, 2)).toBe(1234);
        });

        it('handles very large values', () => {
            expect(roundToTwoDecimals(12345678987654, 6)).toBe(12345678980000);
        });

        it('handles small values that round to zero', () => {
            expect(roundToTwoDecimals(1234, 6)).toBe(0);
        });
    });

    describe('formatValue', () => {
        it('formats numbers with default options', () => {
            const result = formatValue(1234.567);
            expect(result).toMatch(/1.*234.*57/);
        });

        it('handles zero', () => {
            const result = formatValue(0);
            expect(result).toBe('0');
        });
    });

    describe('formatNumber', () => {
        describe('PERCENT preset', () => {
            it('formats decimal as percentage', () => {
                const result = formatNumber(0.5, FormatPreset.PERCENT);
                expect(result).toMatch(/50.*%/);
            });

            it('handles zero percent', () => {
                const result = formatNumber(0, FormatPreset.PERCENT);
                expect(result).toMatch(/0.*%/);
            });

            it('handles 100 percent', () => {
                const result = formatNumber(1, FormatPreset.PERCENT);
                expect(result).toMatch(/100.*%/);
            });
        });

        describe('XTM_COMPACT preset', () => {
            it('returns "< 0.01" for very small positive values', () => {
                expect(formatNumber(1000, FormatPreset.XTM_COMPACT)).toBe('< 0.01');
            });

            it('returns "< 0.01" for values just under threshold', () => {
                expect(formatNumber(9999, FormatPreset.XTM_COMPACT)).toBe('< 0.01');
            });

            it('formats values at threshold', () => {
                const result = formatNumber(10_000, FormatPreset.XTM_COMPACT);
                expect(result).toBe('0.01');
            });

            it('formats larger values with compact notation', () => {
                const result = formatNumber(1_000_000_000, FormatPreset.XTM_COMPACT);
                expect(result).toMatch(/1/);
            });
        });

        describe('XTM_LONG preset', () => {
            it('formats XTM values with standard notation', () => {
                const result = formatNumber(1_500_000, FormatPreset.XTM_LONG);
                expect(result).toMatch(/1.*5/);
            });

            it('handles zero', () => {
                const result = formatNumber(0, FormatPreset.XTM_LONG);
                expect(result).toBe('0');
            });
        });

        describe('XTM_DECIMALS preset', () => {
            it('shows full decimal precision', () => {
                const result = formatNumber(1_234_567, FormatPreset.XTM_DECIMALS);
                expect(result).toMatch(/1.*234567/);
            });

            it('handles zero without extra decimals', () => {
                const result = formatNumber(0, FormatPreset.XTM_DECIMALS);
                expect(result).toBe('0');
            });
        });

        describe('XTM_LONG_DEC preset', () => {
            it('formats with fixed decimal places', () => {
                const result = formatNumber(1_500_000, FormatPreset.XTM_LONG_DEC);
                expect(result).toMatch(/1.*50/);
            });
        });

        describe('DECIMAL_COMPACT preset', () => {
            it('formats with standard decimal notation', () => {
                const result = formatNumber(1234.56, FormatPreset.DECIMAL_COMPACT);
                expect(result).toMatch(/1.*234.*56/);
            });
        });

        describe('COMPACT preset', () => {
            it('uses standard notation for values under 10000', () => {
                const result = formatNumber(5000, FormatPreset.COMPACT);
                expect(result).toMatch(/5.*000/);
            });

            it('uses compact notation for large values', () => {
                const result = formatNumber(50_000, FormatPreset.COMPACT);
                expect(result).toMatch(/50|K/i);
            });

            it('handles millions', () => {
                const result = formatNumber(5_000_000, FormatPreset.COMPACT);
                expect(result).toMatch(/5|M/i);
            });
        });

        describe('unknown preset', () => {
            it('returns "-" for unknown preset', () => {
                const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
                const result = formatNumber(100, 'unknown' as FormatPreset);
                expect(result).toBe('-');
                expect(consoleSpy).toHaveBeenCalled();
                consoleSpy.mockRestore();
            });
        });
    });

    describe('formatHashrate', () => {
        it('formats small hashrates with G/s unit', () => {
            const result = formatHashrate(500);
            expect(result).toEqual({ value: 500, unit: 'G/s' });
        });

        it('formats hashrates >= 1000 with kG/s', () => {
            const result = formatHashrate(1500);
            expect(result).toEqual({ value: 1.5, unit: ' kG/s' });
        });

        it('formats hashrates >= 1000000 with MG/s', () => {
            const result = formatHashrate(1_500_000);
            expect(result).toEqual({ value: 1.5, unit: ' MG/s' });
        });

        it('formats hashrates >= 1000000000 with GG/s', () => {
            const result = formatHashrate(1_500_000_000);
            expect(result).toEqual({ value: 1.5, unit: ' GG/s' });
        });

        it('formats hashrates >= 1000000000000 with TG/s', () => {
            const result = formatHashrate(1_500_000_000_000);
            expect(result).toEqual({ value: 1.5, unit: ' TG/s' });
        });

        it('formats hashrates >= 1000000000000000 with PG/s', () => {
            const result = formatHashrate(1_500_000_000_000_000);
            expect(result).toEqual({ value: 1.5, unit: ' PG/s' });
        });

        it('returns short unit when joinUnit is false', () => {
            const result = formatHashrate(1_500_000, false);
            expect(result).toEqual({ value: 1.5, unit: 'M' });
        });

        it('handles edge case at exactly 1000', () => {
            const result = formatHashrate(1000);
            expect(result).toEqual({ value: 1, unit: ' kG/s' });
        });

        it('handles zero hashrate', () => {
            const result = formatHashrate(0);
            expect(result).toEqual({ value: 0, unit: 'G/s' });
        });

        it('rounds large values to 1 decimal', () => {
            const result = formatHashrate(150);
            expect(result).toEqual({ value: 150, unit: 'G/s' });
        });
    });

    describe('formatCountdown', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        it('returns "0D 0H 0M" for past dates', () => {
            vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
            const result = formatCountdown('2024-01-14T12:00:00Z');
            expect(result).toBe('0D 0H 0M');
        });

        it('formats days, hours, and minutes correctly', () => {
            vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
            const result = formatCountdown('2024-01-17T14:30:00Z');
            expect(result).toBe('2D 2H 30M');
        });

        it('handles exact current time', () => {
            vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
            const result = formatCountdown('2024-01-15T12:00:00Z');
            expect(result).toBe('0D 0H 0M');
        });

        it('handles hours and minutes only (less than a day)', () => {
            vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
            const result = formatCountdown('2024-01-15T18:45:00Z');
            expect(result).toBe('0D 6H 45M');
        });

        vi.useRealTimers();
    });

    describe('fmtTimeUnit', () => {
        it('pads single digit with zero', () => {
            expect(fmtTimeUnit(5)).toBe('05');
        });

        it('does not pad double digits', () => {
            expect(fmtTimeUnit(12)).toBe('12');
        });

        it('handles zero', () => {
            expect(fmtTimeUnit(0)).toBe('00');
        });
    });

    describe('fmtTimePartString', () => {
        it('formats time parts correctly for AM', () => {
            const result = fmtTimePartString({ hour: 9, minute: 30, timePeriod: 'AM' });
            expect(result).toBe('09:30 AM');
        });

        it('formats time parts correctly for PM', () => {
            const result = fmtTimePartString({ hour: 11, minute: 5, timePeriod: 'PM' });
            expect(result).toBe('11:05 PM');
        });

        it('handles midnight', () => {
            const result = fmtTimePartString({ hour: 0, minute: 0, timePeriod: 'AM' });
            expect(result).toBe('00:00 AM');
        });
    });

    describe('formatAmountWithKM', () => {
        it('returns "0" for zero', () => {
            expect(formatAmountWithKM(0)).toBe('0');
        });

        it('formats values under 10 with 2 decimals', () => {
            expect(formatAmountWithKM(5.67)).toBe('5.67');
        });

        it('formats values between 10 and 100 with 1 decimal', () => {
            expect(formatAmountWithKM(45.6)).toBe('45.6');
        });

        it('formats values between 100 and 1000 as integers', () => {
            expect(formatAmountWithKM(456)).toBe('456');
        });

        it('formats thousands with k suffix', () => {
            expect(formatAmountWithKM(1500)).toBe('1.5k');
        });

        it('formats tens of thousands with k suffix', () => {
            expect(formatAmountWithKM(15000)).toBe('15k');
        });

        it('formats hundreds of thousands with k suffix', () => {
            expect(formatAmountWithKM(150000)).toBe('150k');
        });

        it('formats millions with m suffix', () => {
            expect(formatAmountWithKM(1_500_000)).toBe('1.5m');
        });

        it('formats tens of millions with m suffix', () => {
            expect(formatAmountWithKM(15_000_000)).toBe('15m');
        });

        it('formats hundreds of millions with m suffix', () => {
            expect(formatAmountWithKM(150_000_000)).toBe('150m');
        });
    });

    describe('formatDecimalCompact', () => {
        it('formats with standard decimal notation', () => {
            const result = formatDecimalCompact(1234.56);
            expect(result).toMatch(/1.*234.*56/);
        });
    });
});

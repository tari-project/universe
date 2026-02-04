import { describe, it, expect } from 'vitest';
import calculateTimeSince, { TimeSince } from './calculateTimeSince';

describe('calculateTimeSince', () => {
    describe('basic calculations', () => {
        it('calculates zero difference for same timestamps', () => {
            const now = Date.now();
            const result = calculateTimeSince(now / 1000, now);
            expect(result.days).toBe(0);
            expect(result.hours).toBe(0);
            expect(result.minutes).toBe('00');
            expect(result.seconds).toBe('00');
        });

        it('calculates seconds correctly', () => {
            const earlier = 1000; // 1000 seconds since epoch
            const later = 1045000; // 45 seconds after earlier (in ms)
            const result = calculateTimeSince(earlier, later);
            expect(result.seconds).toBe('45');
        });

        it('calculates minutes correctly', () => {
            const earlier = 1000;
            const later = 1000 * 1000 + 5 * 60 * 1000; // 5 minutes later
            const result = calculateTimeSince(earlier, later);
            expect(result.minutes).toBe('05');
        });

        it('calculates hours correctly', () => {
            const earlier = 1000;
            const later = 1000 * 1000 + 3 * 60 * 60 * 1000; // 3 hours later
            const result = calculateTimeSince(earlier, later);
            expect(result.hours).toBe(3);
            expect(result.hoursString).toBe('03');
        });

        it('calculates days correctly', () => {
            const earlier = 1000;
            const later = 1000 * 1000 + 2 * 24 * 60 * 60 * 1000; // 2 days later
            const result = calculateTimeSince(earlier, later);
            expect(result.days).toBe(2);
        });
    });

    describe('string formatting', () => {
        it('pads single digit hours with zero', () => {
            const earlier = 1000;
            const later = 1000 * 1000 + 5 * 60 * 60 * 1000; // 5 hours later
            const result = calculateTimeSince(earlier, later);
            expect(result.hoursString).toBe('05');
        });

        it('pads single digit minutes with zero', () => {
            const earlier = 1000;
            const later = 1000 * 1000 + 3 * 60 * 1000; // 3 minutes later
            const result = calculateTimeSince(earlier, later);
            expect(result.minutes).toBe('03');
        });

        it('pads single digit seconds with zero', () => {
            const earlier = 1000;
            const later = 1000 * 1000 + 7 * 1000; // 7 seconds later
            const result = calculateTimeSince(earlier, later);
            expect(result.seconds).toBe('07');
        });

        it('formats daysString with singular for 1 day', () => {
            const earlier = 1000;
            const later = 1000 * 1000 + 1 * 24 * 60 * 60 * 1000; // 1 day later
            const result = calculateTimeSince(earlier, later);
            expect(result.daysString).toBe('1 day ');
        });

        it('formats daysString with plural for multiple days', () => {
            const earlier = 1000;
            const later = 1000 * 1000 + 3 * 24 * 60 * 60 * 1000; // 3 days later
            const result = calculateTimeSince(earlier, later);
            expect(result.daysString).toBe('3 days ');
        });

        it('returns empty daysString for zero days', () => {
            const earlier = 1000;
            const later = 1000 * 1000 + 5 * 60 * 60 * 1000; // 5 hours later
            const result = calculateTimeSince(earlier, later);
            expect(result.daysString).toBe('');
        });
    });

    describe('complex durations', () => {
        it('handles combination of days, hours, minutes, seconds', () => {
            const earlier = 1000;
            // 2 days, 5 hours, 30 minutes, 45 seconds later
            const duration =
                2 * 24 * 60 * 60 * 1000 + // 2 days
                5 * 60 * 60 * 1000 + // 5 hours
                30 * 60 * 1000 + // 30 minutes
                45 * 1000; // 45 seconds
            const later = 1000 * 1000 + duration;
            const result = calculateTimeSince(earlier, later);

            expect(result.days).toBe(2);
            expect(result.daysString).toBe('2 days ');
            expect(result.hours).toBe(5);
            expect(result.hoursString).toBe('05');
            expect(result.minutes).toBe('30');
            expect(result.seconds).toBe('45');
        });

        it('handles exactly 24 hours', () => {
            const earlier = 1000;
            const later = 1000 * 1000 + 24 * 60 * 60 * 1000;
            const result = calculateTimeSince(earlier, later);
            expect(result.days).toBe(1);
            expect(result.hours).toBe(0);
        });

        it('handles exactly 60 minutes', () => {
            const earlier = 1000;
            const later = 1000 * 1000 + 60 * 60 * 1000;
            const result = calculateTimeSince(earlier, later);
            expect(result.hours).toBe(1);
            expect(result.minutes).toBe('00');
        });

        it('handles exactly 60 seconds', () => {
            const earlier = 1000;
            const later = 1000 * 1000 + 60 * 1000;
            const result = calculateTimeSince(earlier, later);
            expect(result.minutes).toBe('01');
            expect(result.seconds).toBe('00');
        });
    });

    describe('return type structure', () => {
        it('returns correct TimeSince structure', () => {
            const earlier = 1000;
            const later = 1000 * 1000 + 1000;
            const result: TimeSince = calculateTimeSince(earlier, later);

            expect(result).toHaveProperty('days');
            expect(result).toHaveProperty('daysString');
            expect(result).toHaveProperty('hours');
            expect(result).toHaveProperty('hoursString');
            expect(result).toHaveProperty('minutes');
            expect(result).toHaveProperty('seconds');
        });

        it('returns numeric days and hours', () => {
            const earlier = 1000;
            const later = 1000 * 1000 + 1000;
            const result = calculateTimeSince(earlier, later);

            expect(typeof result.days).toBe('number');
            expect(typeof result.hours).toBe('number');
        });

        it('returns string minutes and seconds', () => {
            const earlier = 1000;
            const later = 1000 * 1000 + 1000;
            const result = calculateTimeSince(earlier, later);

            expect(typeof result.minutes).toBe('string');
            expect(typeof result.seconds).toBe('string');
        });
    });

    describe('edge cases', () => {
        it('handles very large time differences', () => {
            const earlier = 0;
            const later = 365 * 24 * 60 * 60 * 1000; // 1 year in ms
            const result = calculateTimeSince(earlier, later);
            expect(result.days).toBe(365);
        });

        it('handles input where earlier is in seconds', () => {
            const earlier = 1609459200; // 2021-01-01 00:00:00 UTC in seconds
            const later = 1609459200 * 1000 + 3600000; // 1 hour later in ms
            const result = calculateTimeSince(earlier, later);
            expect(result.hours).toBe(1);
        });
    });
});

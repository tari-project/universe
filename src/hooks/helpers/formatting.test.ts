import { describe, it, expect } from 'vitest';
import { formatSecondsToMmSs } from './formatting';

describe('formatSecondsToMmSs', () => {
    describe('basic formatting', () => {
        it('formats zero seconds', () => {
            expect(formatSecondsToMmSs(0)).toBe('00:00');
        });

        it('formats single digit seconds', () => {
            expect(formatSecondsToMmSs(5)).toBe('00:05');
        });

        it('formats double digit seconds', () => {
            expect(formatSecondsToMmSs(45)).toBe('00:45');
        });

        it('formats exactly 60 seconds as 1 minute', () => {
            expect(formatSecondsToMmSs(60)).toBe('01:00');
        });

        it('formats minutes and seconds', () => {
            expect(formatSecondsToMmSs(90)).toBe('01:30');
        });

        it('formats double digit minutes', () => {
            expect(formatSecondsToMmSs(600)).toBe('10:00');
        });

        it('formats mixed minutes and seconds', () => {
            expect(formatSecondsToMmSs(754)).toBe('12:34');
        });
    });

    describe('edge cases', () => {
        it('handles large values (over an hour)', () => {
            expect(formatSecondsToMmSs(3661)).toBe('61:01');
        });

        it('handles very large values', () => {
            expect(formatSecondsToMmSs(6000)).toBe('100:00');
        });

        it('handles floating point seconds by flooring', () => {
            expect(formatSecondsToMmSs(90.9)).toBe('01:30');
        });

        it('handles negative floating point gracefully', () => {
            expect(formatSecondsToMmSs(59.999)).toBe('00:59');
        });
    });

    describe('padding', () => {
        it('pads single digit minutes', () => {
            expect(formatSecondsToMmSs(65)).toBe('01:05');
        });

        it('pads single digit seconds with double digit minutes', () => {
            expect(formatSecondsToMmSs(601)).toBe('10:01');
        });

        it('does not over-pad triple digit minutes', () => {
            const result = formatSecondsToMmSs(6001);
            expect(result).toBe('100:01');
        });
    });
});

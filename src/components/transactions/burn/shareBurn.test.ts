import { describe, expect, it } from 'vitest';
import { PRE_BURN_ENDS, isPreBurn } from './shareBurn';

describe('burn share', () => {
    it('is a pre-burn until 11 November 2026 UTC and a plain burn from then on', () => {
        expect(isPreBurn(Date.UTC(2026, 9, 27))).toBe(true);
        expect(isPreBurn(PRE_BURN_ENDS - 1)).toBe(true);
        expect(isPreBurn(PRE_BURN_ENDS)).toBe(false);
        expect(isPreBurn(Date.UTC(2026, 10, 12))).toBe(false);
    });
});

import { describe, expect, it } from 'vitest';
import { PRE_BURN_ENDS, isPreBurn, xPostUrl } from './shareBurn';

describe('burn share', () => {
    it('is a pre-burn until 11 November 2026 UTC and a plain burn from then on', () => {
        expect(isPreBurn(Date.UTC(2026, 9, 27))).toBe(true);
        expect(isPreBurn(PRE_BURN_ENDS - 1)).toBe(true);
        expect(isPreBurn(PRE_BURN_ENDS)).toBe(false);
        expect(isPreBurn(Date.UTC(2026, 10, 12))).toBe(false);
    });

    it('builds an X composer link with the text encoded', () => {
        expect(xPostUrl('I just pre-burned 10 XTM. https://tari.com/burns')).toBe(
            'https://x.com/intent/post?text=I%20just%20pre-burned%2010%20XTM.%20https%3A%2F%2Ftari.com%2Fburns'
        );
    });
});

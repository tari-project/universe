/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { getIframeOrigin } from './iframeOrigin';

describe('getIframeOrigin', () => {
    it('returns the origin of an absolute URL', () => {
        expect(getIframeOrigin('https://swap.tari.com/app?x=1')).toBe('https://swap.tari.com');
        expect(getIframeOrigin('http://localhost:1234/index.html')).toBe('http://localhost:1234');
    });

    it('returns null for empty or unparseable sources', () => {
        expect(getIframeOrigin('')).toBeNull();
        expect(getIframeOrigin(null)).toBeNull();
        expect(getIframeOrigin(undefined)).toBeNull();
        expect(getIframeOrigin('http://')).toBeNull();
    });

    it('returns null for opaque origins', () => {
        expect(getIframeOrigin('about:blank')).toBeNull();
        expect(getIframeOrigin('data:text/html,hi')).toBeNull();
    });
});

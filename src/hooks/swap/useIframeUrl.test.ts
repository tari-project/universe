/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../airdrop/utils/useHandleRequest', () => ({
    handleAirdropRequest: vi.fn(),
}));

import { handleAirdropRequest } from '../airdrop/utils/useHandleRequest';
import {
    DEFAULT_SWAPS_URL,
    getAllowedSwapOrigin,
    isAllowedSwapOrigin,
    resolveSwapIframeUrl,
    useIframeUrl,
} from './useIframeUrl';

describe('swap URL and origin validation', () => {
    beforeEach(() => {
        vi.spyOn(console, 'warn')
            .mockImplementation(() => undefined)
            .mockClear();
        vi.spyOn(console, 'info')
            .mockImplementation(() => undefined)
            .mockClear();
        vi.spyOn(console, 'error')
            .mockImplementation(() => undefined)
            .mockClear();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.mocked(handleAirdropRequest).mockReset();
    });

    it('accepts only origins on the static allowlist', () => {
        expect(isAllowedSwapOrigin('https://tari.com')).toBe(true);
        expect(isAllowedSwapOrigin('http://tari.com')).toBe(false);
        expect(isAllowedSwapOrigin('https://tari.com:8443')).toBe(false);
        expect(isAllowedSwapOrigin('https://evil.example')).toBe(false);
        expect(isAllowedSwapOrigin('https://tari.com.evil.example')).toBe(false);
        expect(isAllowedSwapOrigin(null)).toBe(false);
    });

    it('extracts the pinned origin only for allowlisted https URLs without credentials', () => {
        expect(getAllowedSwapOrigin('https://tari.com/swaps?theme=dark')).toBe('https://tari.com');
        expect(getAllowedSwapOrigin('http://tari.com/swaps')).toBeNull();
        expect(getAllowedSwapOrigin('https://user:pass@tari.com/swaps')).toBeNull();
        expect(getAllowedSwapOrigin('https://evil.example/swaps')).toBeNull();
        expect(getAllowedSwapOrigin('javascript:alert(1)')).toBeNull();
        expect(getAllowedSwapOrigin('/swaps')).toBeNull();
        expect(getAllowedSwapOrigin('')).toBeNull();
    });

    it('resolves allowlisted https URLs and falls back to the hardcoded default on mismatch', () => {
        expect(resolveSwapIframeUrl('https://tari.com/swaps?tab=buy')).toBe('https://tari.com/swaps?tab=buy');
        expect(resolveSwapIframeUrl('http://tari.com/swaps')).toBe(DEFAULT_SWAPS_URL);
        expect(resolveSwapIframeUrl('https://evil.example/swaps')).toBe(DEFAULT_SWAPS_URL);
        expect(resolveSwapIframeUrl('javascript:alert(1)')).toBe(DEFAULT_SWAPS_URL);
        expect(resolveSwapIframeUrl('not-a-url')).toBe(DEFAULT_SWAPS_URL);
    });

    it('uses an allowlisted URL returned by /swaps/url', async () => {
        vi.mocked(handleAirdropRequest).mockResolvedValue({ url: 'https://tari.com/swaps?custom=1' });

        const { result } = renderHook(() => useIframeUrl());

        await waitFor(() => {
            expect(result.current).toBe('https://tari.com/swaps?custom=1');
        });
    });

    it('falls back to https://tari.com/swaps when /swaps/url returns an untrusted origin', async () => {
        vi.mocked(handleAirdropRequest).mockResolvedValue({ url: 'https://evil.example/swaps' });

        const { result } = renderHook(() => useIframeUrl());

        await waitFor(() => {
            expect(handleAirdropRequest).toHaveBeenCalled();
        });
        expect(result.current).toBe(DEFAULT_SWAPS_URL);
        expect(console.warn).toHaveBeenCalledTimes(1);
    });
});

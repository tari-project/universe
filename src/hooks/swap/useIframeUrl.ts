import { useCallback, useEffect, useRef, useState } from 'react';
import { handleAirdropRequest } from '../airdrop/utils/useHandleRequest';

export const DEFAULT_SWAPS_URL = 'https://tari.com/swaps';
export const ALLOWED_SWAP_ORIGINS: readonly string[] = ['https://tari.com'];

/**
 * Checks whether an origin belongs to the static swap iframe allowlist.
 * Pinning postMessage verification to this static list prevents a compromised or
 * misconfigured `/swaps/url` response from authorising an arbitrary origin to
 * trigger swap confirmation, approval or WalletConnect dialogs.
 */
export function isAllowedSwapOrigin(origin: unknown): origin is string {
    if (typeof origin !== 'string') return false;
    return ALLOWED_SWAP_ORIGINS.includes(origin);
}

function hasEmbeddedCredentials(parsed: URL): boolean {
    return Boolean(parsed.username || parsed.password);
}

/**
 * Extracts the origin of a candidate swap URL when it uses `https:`, carries no
 * embedded credentials, and matches `ALLOWED_SWAP_ORIGINS`. Returns `null` otherwise.
 */
export function getAllowedSwapOrigin(candidate: unknown): string | null {
    if (typeof candidate !== 'string' || !candidate) return null;

    try {
        const parsed = new URL(candidate);
        if (parsed.protocol !== 'https:' || hasEmbeddedCredentials(parsed)) {
            return null;
        }
        return isAllowedSwapOrigin(parsed.origin) ? parsed.origin : null;
    } catch {
        return null;
    }
}

/**
 * Validates the swap iframe URL returned by `GET /swaps/url` against the static
 * HTTPS origin allowlist, falling back to `DEFAULT_SWAPS_URL` on any mismatch.
 */
export function resolveSwapIframeUrl(candidate: unknown): string {
    if (!getAllowedSwapOrigin(candidate)) {
        console.warn('Rejected untrusted swaps URL, falling back to default swaps URL');
        return DEFAULT_SWAPS_URL;
    }
    return candidate as string;
}

export const useIframeUrl = () => {
    const urlRef = useRef<string | null>(null);
    const [url, setUrl] = useState<string | null>(urlRef.current);

    const handleFetchUrl = useCallback((onSuccess?: () => void) => {
        handleAirdropRequest<{ url: string }>({
            path: '/swaps/url',
            method: 'GET',
            publicRequest: true,
            onError: () => setUrl(null),
        }).then((data) => {
            if (!data?.url) {
                console.error('Failed to fetch swaps url');
                return;
            }
            const resolvedUrl = resolveSwapIframeUrl(data.url);
            urlRef.current = resolvedUrl;
            setUrl(resolvedUrl);
            onSuccess?.();
        });
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!urlRef.current && url === null) {
                console.info('Fetching swaps url');
                handleFetchUrl(() => {
                    clearInterval(interval);
                });
            } else {
                clearInterval(interval);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [handleFetchUrl, url]);

    return url || urlRef.current || DEFAULT_SWAPS_URL;
};

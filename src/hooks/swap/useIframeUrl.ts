import { useCallback, useEffect, useRef, useState } from 'react';
import { handleAirdropRequest } from '../airdrop/utils/useHandleRequest';

const INITIAL_RETRY_DELAY_MS = 2000;
const MAX_RETRY_DELAY_MS = 60_000;
const MAX_RETRIES = 6;

export const useIframeUrl = () => {
    const urlRef = useRef<string | null>(null);
    const [url, setUrl] = useState<string | null>(urlRef.current);

    const handleFetchUrl = useCallback(async (): Promise<boolean> => {
        try {
            const data = await handleAirdropRequest<{ url: string }>({
                path: '/swaps/url',
                method: 'GET',
                publicRequest: true,
                onError: () => setUrl(null),
            });
            if (!data?.url) {
                return false;
            }
            urlRef.current = data.url;
            setUrl(data.url);
            return true;
        } catch {
            return false;
        }
    }, []);

    useEffect(() => {
        if (urlRef.current || url !== null) return;

        let cancelled = false;
        let retryTimeout: NodeJS.Timeout | null = null;
        let attempt = 0;

        const attemptFetch = async () => {
            if (cancelled || urlRef.current) return;
            if (attempt === 0) {
                console.info('Fetching swaps url');
            }
            const success = await handleFetchUrl();
            if (cancelled || success || urlRef.current) return;

            attempt += 1;
            if (attempt > MAX_RETRIES) {
                console.error('Failed to fetch swaps url after retries');
                return;
            }
            const delay = Math.min(INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS);
            retryTimeout = setTimeout(() => {
                retryTimeout = null;
                void attemptFetch();
            }, delay);
        };

        void attemptFetch();

        return () => {
            cancelled = true;
            if (retryTimeout !== null) {
                clearTimeout(retryTimeout);
            }
        };
    }, [handleFetchUrl, url]);

    return url || urlRef.current || 'https://tari.com/swaps';
};

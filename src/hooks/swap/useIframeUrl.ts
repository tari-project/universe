import { useCallback, useEffect, useRef, useState } from 'react';
import { handleAirdropRequest } from '../airdrop/utils/useHandleRequest';

const MAX_SWAP_URL_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

export const useIframeUrl = () => {
    const urlRef = useRef<string | null>(null);
    const [url, setUrl] = useState<string | null>(urlRef.current);

    const handleFetchUrl = useCallback(async (): Promise<boolean> => {
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
    }, []);

    useEffect(() => {
        if (urlRef.current || url !== null) {
            return;
        }
        let cancelled = false;
        let retryTimeout: ReturnType<typeof setTimeout> | null = null;
        let attempts = 0;

        const attemptFetch = async () => {
            if (cancelled || urlRef.current) return;
            attempts += 1;
            const resolved = await handleFetchUrl();
            if (!cancelled && !resolved && attempts < MAX_SWAP_URL_ATTEMPTS) {
                retryTimeout = setTimeout(() => {
                    void attemptFetch();
                }, RETRY_DELAY_MS);
            }
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

import { useCallback, useEffect, useRef, useState } from 'react';
import { handleAirdropRequest } from '../airdrop/utils/useHandleRequest';

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
            urlRef.current = data.url;
            setUrl(data.url);
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

    return url || urlRef.current || 'https://tari.com/swaps';
};

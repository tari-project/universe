import { useEffect, useRef, useState } from 'react';
import { handleAirdropRequest } from '../airdrop/utils/useHandleRequest';

export const useIframeUrl = () => {
    const urlRef = useRef<string | null>(null);
    const [url, setUrl] = useState<string | null>(urlRef.current);

    useEffect(() => {
        handleAirdropRequest<{ url: string }>({
            path: '/swaps/url',
            method: 'GET',
            publicRequest: true,
            onError: () => setUrl(null),
        }).then((data) => {
            if (data?.url) {
                urlRef.current = data.url;
                setUrl(data.url);
            }
        });
    }, []);

    return url || urlRef.current;
};

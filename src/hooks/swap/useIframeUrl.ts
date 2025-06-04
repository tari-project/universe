import { useEffect, useState } from 'react';
import { handleAirdropRequest } from '../airdrop/utils/useHandleRequest';

export const useIframeUrl = () => {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        handleAirdropRequest<{ url: string }>({
            path: '/swaps/url',
            method: 'GET',
            onError: () => setUrl(null),
        }).then((data) => {
            if (data?.url) {
                setUrl(data.url);
            }
        });
    }, []);

    return url;
};

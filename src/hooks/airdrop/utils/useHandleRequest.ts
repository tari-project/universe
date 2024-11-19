import * as Sentry from '@sentry/react';
import { useAirdropStore } from '@app/store/useAirdropStore';

interface RequestProps {
    path: string;
    method: 'GET' | 'POST';
    body?: Record<string, unknown>;
    onError?: (e: unknown) => void;
}

export const useAirdropRequest = () => {
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);
    const airdropTokenExpiration = useAirdropStore((state) => state.airdropTokens?.expiresAt);
    const baseUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropApiUrl);

    return async <T>({ body, method, path, onError }: RequestProps) => {
        const isTokenExpired = !airdropTokenExpiration || airdropTokenExpiration * 1000 < Date.now();
        if (!baseUrl || !airdropToken || isTokenExpired) return;

        const fullUrl = `${baseUrl}${path}`;

        const response = await fetch(fullUrl, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${airdropToken}`,
            },
            body: JSON.stringify(body),
        });

        try {
            if (!response.ok) {
                console.error('Error fetching airdrop request:', response);
                Sentry.captureMessage('Error fetching airdrop request', { extra: { fullUrl } });
                if (onError) {
                    onError(response);
                }
                return;
            }
            return response.json() as Promise<T>;
        } catch (e) {
            Sentry.captureException(e, { data: { fullUrl } });
            console.error('Caught error fetching airdrop data:', e);

            if (onError) {
                onError(e);
            }
            return;
        }
    };
};

import { useAirdropStore } from '@app/store/useAirdropStore';

interface RequestProps {
    path: string;
    method: 'GET' | 'POST';
    body?: Record<string, unknown>;
    onError?: (e: unknown) => void;
}

export const useAirdropRequest = () => {
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);
    const baseUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropApiUrl);

    return async <T>({ body, method, path, onError }: RequestProps) => {
        if (!baseUrl || !airdropToken) return;
        const response = await fetch(`${baseUrl}${path}`, {
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
                if (onError) {
                    onError(response);
                }
                return;
            }
            return response.json() as Promise<T>;
        } catch (e) {
            console.error('Caught error fetching airdrop data:', e);

            if (onError) {
                onError(e);
            }
            return;
        }
    };
};

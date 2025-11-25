import { useQuery } from '@tanstack/react-query';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest';
import type { CsrfTokenResponse } from '@app/types/airdrop-claim';
import { useAirdropStore } from '@app/store';

export const KEY_CSRF_TOKEN = 'csrf_token';

async function fetchCsrfToken(): Promise<CsrfTokenResponse | null> {
    console.info('🛡️ Fetching CSRF token...');

    try {
        const response = await handleAirdropRequest<CsrfTokenResponse>({
            path: '/tari/airdrop/csrf-token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response?.success || !response?.csrfToken) {
            return null;
        }
        return response;
    } catch (e) {
        console.error('Failed to fetch CSRF token', e);
        return null;
    }
}

export function useCsrfToken() {
    const userId = useAirdropStore((state) => state.userDetails?.user?.id);
    return useQuery({
        queryKey: [KEY_CSRF_TOKEN, userId],
        queryFn: fetchCsrfToken,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        enabled: !!userId?.length,
    });
}

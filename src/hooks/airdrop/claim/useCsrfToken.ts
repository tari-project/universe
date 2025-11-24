import { useQuery } from '@tanstack/react-query';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest';
import type { CsrfTokenResponse } from '@app/types/airdrop-claim';
import { useAirdropStore } from '@app/store';

export const KEY_CSRF_TOKEN = 'csrf_token';

async function fetchCsrfToken(): Promise<CsrfTokenResponse> {
    console.log('🛡️ Fetching CSRF token...');

    const response = await handleAirdropRequest<CsrfTokenResponse>({
        path: '/tari/airdrop/csrf-token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    console.log('🛡️ CSRF token response:', response);

    if (!response?.success || !response?.csrfToken) {
        throw new Error('Failed to fetch CSRF token');
    }

    return response;
}

export function useCsrfToken() {
    const user = useAirdropStore((state) => state.userDetails?.user?.id);
    return useQuery({
        queryKey: [KEY_CSRF_TOKEN, user],
        queryFn: fetchCsrfToken,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        enabled: !!user,
    });
}

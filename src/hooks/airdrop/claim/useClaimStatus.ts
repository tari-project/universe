import { useQuery } from '@tanstack/react-query';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest';
import type { ClaimStatus } from '@app/types/airdrop-claim';

export const KEY_CLAIM_STATUS = 'claim_status';

interface ClaimStatusResponse {
    success: boolean;
    data: ClaimStatus;
}

async function fetchClaimStatus(): Promise<ClaimStatus> {
    const response = await handleAirdropRequest<ClaimStatusResponse>({
        path: '/tari/airdrop/status',
        method: 'GET',
    });

    if (!response?.success || !response?.data) {
        throw new Error('Failed to fetch claim status');
    }

    return response.data;
}

export function useClaimStatus(enabled: boolean = true) {
    return useQuery({
        queryKey: [KEY_CLAIM_STATUS],
        queryFn: fetchClaimStatus,
        enabled,
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 2 * 60 * 1000, // 2 minutes
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchInterval: (query) => {
            // Only poll if we have a claim available
            return query.state.data?.hasClaim ? 30 * 1000 : false;
        },
    });
}

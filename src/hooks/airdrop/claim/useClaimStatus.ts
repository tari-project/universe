import { useQuery } from '@tanstack/react-query';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest';
import type { ClaimStatus } from '@app/types/airdrop-claim';
import { useAirdropStore } from '@app/store';

export const KEY_CLAIM_STATUS = 'claim_status';

interface ClaimStatusResponse {
    success: boolean;
    data: ClaimStatus;
}

async function fetchClaimStatus(): Promise<ClaimStatus | undefined> {
    try {
        const response = await handleAirdropRequest<ClaimStatusResponse>({
            path: '/tari/airdrop/status',
            method: 'GET',
        });

        if (!response?.success || !response?.data) {
            return;
        }

        return response.data;
    } catch (e) {
        console.error('Failed to fetch claim status', e);
    }
}

export function useClaimStatus(enabled = true) {
    const userId = useAirdropStore((state) => state.userDetails?.user?.id);
    return useQuery({
        queryKey: [KEY_CLAIM_STATUS, userId],
        queryFn: fetchClaimStatus,
        enabled: !!userId?.length && enabled,
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

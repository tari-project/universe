import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';
import { useAirdropStore, useWalletStore } from '@app/store';
import type { ReferrerProgressResponse } from '@app/store/useAirdropStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const KEY_REFERRER_PROGRESS = 'referrer_progress';

async function fetchReferrerProgressData(props: { walletReceiveKey: string }): Promise<ReferrerProgressResponse> {
    const { walletReceiveKey } = props;

    const response = await handleAirdropRequest<ReferrerProgressResponse>({
        path: '/crew/referrer-progress',
        method: 'POST',
        body: {
            walletReceiveKey,
        },
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response?.referrerProgress) {
        throw new Error('Failed to fetch referrer progress');
    }

    return response;
}

export function useReferrerProgress() {
    const walletReceiveKey = useWalletStore((s) => s.tari_address_base58);
    const airdropToken = useAirdropStore((state) => state.airdropTokens?.token);

    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: [KEY_REFERRER_PROGRESS, airdropToken, walletReceiveKey],
        queryFn: () => fetchReferrerProgressData({ walletReceiveKey }),
        enabled: !!airdropToken && !!walletReceiveKey,
        refetchOnWindowFocus: true,
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
        retry: 2,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({
            queryKey: [KEY_REFERRER_PROGRESS],
        });
    };

    return {
        ...query,
        invalidate,
    };
}

import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import { useAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { useCallback, useEffect } from 'react';

export interface LastMinedBlock {
    createdAt: string;
    updatedAt: string;
    id: string;
    appId: string;
    userId: string;
    blockHeight: string;
    network: string;
    poolId: string | null;
    minedTestTokens: string;
    minedTokenRewardMultiplier: number;
    appliedRewardCeiling: string;
}

export const useGetMiningPoints = () => {
    const anon_id = useAppConfigStore((s) => s.anon_id);
    const handleRequest = useAirdropRequest();
    const setMiningRewardPoints = useAirdropStore((s) => s.setMiningRewardPoints);
    const miningRewardPoints = useAirdropStore((s) => s.miningRewardPoints);

    const getLastMined = useCallback(async () => {
        if (!anon_id) return;

        try {
            const res = await handleRequest<{ lastMinedBlock: LastMinedBlock }>({
                path: `/miner/blocks/last-mined?appId=${encodeURIComponent(anon_id)}`,
                method: 'GET',
            });

            const lastMinedBlock = res?.lastMinedBlock;
            if (lastMinedBlock) {
                const {
                    minedTestTokens: tXTM,
                    minedTokenRewardMultiplier: multiplier,
                    appliedRewardCeiling: gemCeiling,
                    blockHeight,
                } = lastMinedBlock;
                const gems = Number(tXTM) * multiplier;
                const reward = (gems <= Number(gemCeiling) ? gems : Number(gemCeiling)) / 1_000_000;

                if (reward && blockHeight !== miningRewardPoints?.blockHeight) {
                    setMiningRewardPoints({ blockHeight, reward });
                }
            }
        } catch (e) {
            console.error('Last block error:', e);
        }
    }, [anon_id, handleRequest, miningRewardPoints?.blockHeight, setMiningRewardPoints]);

    useEffect(() => {
        getLastMined();
    }, [getLastMined]);
};

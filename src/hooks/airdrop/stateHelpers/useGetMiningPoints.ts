import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import { useAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { useCallback, useEffect } from 'react';

import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';

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
    const airdropTokens = useAirdropStore((s) => s.airdropTokens);
    const earnings = useBlockchainVisualisationStore((s) => s.earnings);

    const getLastMined = useCallback(async () => {
        if (!anon_id || !airdropTokens) return;
        handleRequest<{ lastMinedBlock: LastMinedBlock }>({
            path: `/miner/blocks/last-mined?appId=${encodeURIComponent(anon_id)}`,
            method: 'GET',
        })
            .then((res) => {
                const lastMinedBlock = res?.lastMinedBlock;
                if (lastMinedBlock) {
                    const {
                        minedTestTokens: tXTM,
                        minedTokenRewardMultiplier: multiplier,
                        appliedRewardCeiling: gemCeiling,
                        blockHeight,
                    } = lastMinedBlock || {};
                    const gems = Number(tXTM) * multiplier;
                    const reward = (gems <= Number(gemCeiling) ? gems : Number(gemCeiling)) / 1_000_000;

                    if (reward && blockHeight !== miningRewardPoints?.blockHeight) {
                        setMiningRewardPoints({ blockHeight, reward });
                    }
                }
            })
            .catch((e) => {
                console.error('Error getting last mined block data from airdrop', e);
            });
    }, [airdropTokens, anon_id, handleRequest, miningRewardPoints?.blockHeight, setMiningRewardPoints]);

    useEffect(() => {
        void getLastMined();
    }, [getLastMined, earnings]);
};

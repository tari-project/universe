import { useEffect } from 'react';

import { setReferralQuestPoints } from '@app/store';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';

enum QuestNames {
    MinerReceivedGift = 'miner-received-gift',
    MinerQuestReferral = 'quest-download-referral',
}

interface QuestData {
    displayName: string;
    isNew: boolean;
    name: QuestNames;
    pointTypeName: string;
    points: number;
    questFulfilled: boolean;
    isHidden: boolean;
}

interface QuestDataResponse {
    quests: QuestData[];
}

export const useGetReferralQuestPoints = () => {
    useEffect(() => {
        const handleFetch = async () => {
            const response = await handleAirdropRequest<QuestDataResponse>({
                path: `/quest/list-with-fulfillment`,
                method: 'GET',
            });

            if (!response?.quests.length) return;
            const reducedQuest = response.quests.reduce(
                (acc, quest) => {
                    if (quest.name === QuestNames.MinerReceivedGift) {
                        acc.pointsForClaimingReferral = quest.points;
                    }
                    if (quest.name === QuestNames.MinerQuestReferral) {
                        acc.pointsPerReferral = quest.points;
                    }
                    return acc;
                },
                {
                    pointsPerReferral: 0,
                    pointsForClaimingReferral: 0,
                }
            );
            setReferralQuestPoints(reducedQuest);
        };
        handleFetch();
    }, []);
};

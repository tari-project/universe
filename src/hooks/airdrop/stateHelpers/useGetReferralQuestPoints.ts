import { useEffect } from 'react';
import { useAirdropRequest } from '../utils/useHandleRequest';

import { setReferralQuestPoints } from '@app/store';

export enum QuestNames {
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
    const handleRequest = useAirdropRequest();

    useEffect(() => {
        const handleFetch = async () => {
            const response = await handleRequest<QuestDataResponse>({
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
        // TODO: refactor handleRequest - doesnt' need to be a hook
    }, [handleRequest]);
};

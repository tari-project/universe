import { useEffect } from 'react';
import { useAirdropRequest } from '../utils/useHandleRequest';
import { useAirdropStore } from '@app/store/useAirdropStore';

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
    const handleRequest = useAirdropRequest();
    const setReferralQuestPoints = useAirdropStore((s) => s.setReferralQuestPoints);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};

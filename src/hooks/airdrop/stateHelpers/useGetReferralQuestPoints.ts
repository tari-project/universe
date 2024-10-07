import { useEffect } from 'react';
import { useAridropRequest } from '../utils/useHandleRequest';
import { useAirdropStore } from '@app/store/useAirdropStore';

export enum QuestNames {
    MinerReceivedGift = 'miner-received-gift',
    MinerTokenReward = 'miner-test-token-reward',
    MinerQuestReferral = 'quest-download-referral',
}

interface QuestData {
    displayName: string;
    isNew: boolean;
    id: s;
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
    const handleRequest = useAridropRequest();
    const { setReferralQuestPoints } = useAirdropStore();

    useEffect(() => {
        const handleFetch = async () => {
            const response = await handleRequest<QuestDataResponse>({
                path: `/quest/list-with-fulfillment`,
                method: 'GET',
            });

            if (!response?.quests.length) return;
            const reducedQuest = response.quests.reduce(
                (acc, quest) => {
                    if (quest.name === QuestNames.MinerTokenReward) {
                        console.debug(quest);
                        acc.pointsForMining = quest.points;
                    }
                    if (quest.name === QuestNames.MinerReceivedGift) {
                        acc.pointsForClaimingReferral = quest.points;
                    }
                    if (quest.name === QuestNames.MinerQuestReferral) {
                        acc.pointsPerReferral = quest.points;
                    }
                    return acc;
                },
                {
                    pointsForMining: 0,
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

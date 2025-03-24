import { useAirdropTokensRefresh } from './stateHelpers/useAirdropTokensRefresh';
import { useAirdropUserPointsListener } from './stateHelpers/useAirdropUserPointsListener';
import { useGetReferralQuestPoints } from './stateHelpers/useGetReferralQuestPoints';
import { useXSpaceEventRefresh } from './stateHelpers/useXSpaceEventRefresh';

export const useAirdropSyncState = () => {
    useAirdropTokensRefresh();
    useXSpaceEventRefresh();
    useAirdropUserPointsListener();
    useGetReferralQuestPoints();
};

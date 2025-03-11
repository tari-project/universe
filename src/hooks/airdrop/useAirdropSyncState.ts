import { useAirdropTokensRefresh } from './stateHelpers/useAirdropTokensRefresh';
import { useAirdropUserPointsListener } from './stateHelpers/useAirdropUserPointsListener';
import { useGetReferralQuestPoints } from './stateHelpers/useGetReferralQuestPoints';

export const useAirdropSyncState = () => {
    useAirdropTokensRefresh();
    useAirdropUserPointsListener();
    useGetReferralQuestPoints();
};

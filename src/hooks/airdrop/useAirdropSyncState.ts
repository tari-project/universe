import { useAirdropTokensRefresh } from './stateHelpers/useAirdropTokensRefresh';
import { useAirdropUserPointsListener } from './stateHelpers/useAirdropUserPointsListener';
import { useGetAirdropUserDetails } from './stateHelpers/useGetAirdropUserDetails';
import { useGetReferralQuestPoints } from './stateHelpers/useGetReferralQuestPoints';

export const useAirdropSyncState = () => {
    useAirdropTokensRefresh();
    useGetAirdropUserDetails();
    useAirdropUserPointsListener();
    useGetReferralQuestPoints();
};

import { useAirdropTokensRefresh } from './stateHelpers/useAirdropTokensRefresh';
import { useAirdropUserPointsListener } from './stateHelpers/useAirdropUserPointsListener';
import { useGetAirdropUserDetails } from './stateHelpers/useGetAirdropUserDetails';

export const useAirdropSyncState = () => {
    useAirdropTokensRefresh();
    useGetAirdropUserDetails();
    useAirdropUserPointsListener();
};

import { useAirdropTokensRefresh } from './stateHelpers/useAirdropTokensRefresh';
import { useGetAirdropUserDetails } from './stateHelpers/useGetAirdropUserDetails';

export const useAirdropSyncState = () => {
    useAirdropTokensRefresh();
    useGetAirdropUserDetails();
};

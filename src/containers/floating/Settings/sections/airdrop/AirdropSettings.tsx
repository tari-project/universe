import { useAirdropStore } from '@app/store/useAirdropStore';

import { ApplyInviteCode } from './ApplyInviteCode';
import AirdropLogout from '@app/containers/main/Airdrop/Settings/Logout.tsx';

export const AirdropSettings = () => {
    const { userDetails } = useAirdropStore();
    return <>{!userDetails ? <ApplyInviteCode /> : <AirdropLogout />}</>;
};

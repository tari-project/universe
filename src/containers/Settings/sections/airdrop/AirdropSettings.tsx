import { useAirdropStore } from '@app/store/useAirdropStore';
import AirdropLogout from '@app/containers/Airdrop/Settings/Logout.tsx';
import { ApplyInviteCode } from './ApplyInviteCode';

export const AirdropSettings = () => {
    const { userDetails } = useAirdropStore();
    return <>{!userDetails ? <ApplyInviteCode /> : <AirdropLogout />}</>;
};

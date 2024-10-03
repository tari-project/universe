import { useAirdropStore } from '@app/store/useAirdropStore';
import AirdropLogout from '../Airdrop/Settings/Logout';
import { ApplyInviteCode } from './sections/airdrop/ApplyInviteCode';

export const AirdropSettings = () => {
    const { authUuid } = useAirdropStore();

    return <>{authUuid ? <AirdropLogout /> : <ApplyInviteCode />}</>;
};

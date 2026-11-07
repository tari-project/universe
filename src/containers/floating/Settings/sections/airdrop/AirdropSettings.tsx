import { useAirdropStore } from '@app/store/useAirdropStore';
import AirdropLogout from '@app/containers/main/Airdrop/Settings/Logout.tsx';

export const AirdropSettings = () => {
    const userDetails = useAirdropStore((s) => s.userDetails);
    return userDetails ? <AirdropLogout /> : null;
};

import { useAirdropStore } from '@app/store/useAirdropStore';

import { ApplyInviteCode } from './ApplyInviteCode';
import AirdropLogout from '@app/containers/main/Airdrop/Settings/Logout.tsx';
import NotificationPreferences from '@app/containers/main/Airdrop/Settings/NotificationPreferences.tsx';

export const AirdropSettings = () => {
    const { userDetails } = useAirdropStore();
    return (
        <>
            {!userDetails ? (
                <ApplyInviteCode />
            ) : (
                <>
                    <AirdropLogout />
                    <NotificationPreferences />
                </>
            )}
        </>
    );
};

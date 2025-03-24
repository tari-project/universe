import Invite from './Invite.tsx';
import Gems from './Gems.tsx';
import User from './User.tsx';
import LogIn from './LogIn.tsx';
import { Wrapper } from './items.style';
import { useAirdropStore } from '@app/store';
import { useWebsocket } from '@app/hooks/airdrop/useWebsocket.ts';
import { useAirdropSyncState } from '@app/hooks/airdrop/useAirdropSyncState.ts';

function LoggedInItems() {
    useAirdropSyncState();
    useWebsocket();

    return (
        <>
            <Invite />
            <Gems />
            <User />
        </>
    );
}

export function AirdropSidebarItems() {
    const isLoggedIn = useAirdropStore((s) => !!s.airdropTokens);
    return <Wrapper>{isLoggedIn ? <LoggedInItems /> : <LogIn />}</Wrapper>;
}

import Invite from './Invite.tsx';
import Gems from './Gems.tsx';
import User from './User.tsx';
import LogIn from './LogIn.tsx';
import { Wrapper } from './items.style';
import { useAirdropStore } from '@app/store';
import useAirdropWebsocket from '@app/hooks/airdrop/ws/useAirdropWebsocket.ts';
import { useXSpaceEventRefresh } from '@app/hooks/airdrop/stateHelpers/useXSpaceEventRefresh.ts';

function LoggedInItems() {
    useAirdropWebsocket();
    useXSpaceEventRefresh();
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

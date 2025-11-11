import Invite from './Invite.tsx';
import Gems from './Gems.tsx';
import User from './User.tsx';
import LogIn from './LogIn.tsx';
import { Wrapper } from './items.style';
import { useAirdropStore } from '@app/store';
import useAirdropWebsocket from '@app/hooks/airdrop/ws/useAirdropWebsocket.ts';
import { useAirdropPolling } from '@app/hooks/airdrop/stateHelpers/useAirdropPolling.ts';
import { CommunityMessages } from './components/CommunityMessages/CommunityMessages.tsx';

function LoggedInItems() {
    useAirdropWebsocket();
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
    useAirdropPolling();
    return (
        <Wrapper>
            {isLoggedIn ? <LoggedInItems /> : <LogIn />}
            <CommunityMessages />
        </Wrapper>
    );
}

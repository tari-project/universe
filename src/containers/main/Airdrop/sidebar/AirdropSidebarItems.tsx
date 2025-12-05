import { useAirdropStore } from '@app/store';
import { useAirdropPolling } from '@app/hooks/airdrop/stateHelpers/useAirdropPolling.ts';
import { CommunityMessages } from './components/CommunityMessages/CommunityMessages.tsx';
import useAirdropWebsocket from '@app/hooks/airdrop/ws/useAirdropWebsocket.ts';

import User from './User.tsx';
import LogIn from './LogIn.tsx';
import Claim from './Claim.tsx';
import { Wrapper } from './items.style';

function LoggedInItems() {
    useAirdropWebsocket();
    return (
        <>
            <Claim />
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

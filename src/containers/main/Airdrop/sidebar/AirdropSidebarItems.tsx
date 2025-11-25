import { useAirdropStore } from '@app/store';
import { useAirdropPolling } from '@app/hooks/airdrop/stateHelpers/useAirdropPolling.ts';
import { CommunityMessages } from './components/CommunityMessages/CommunityMessages.tsx';
import useAirdropWebsocket from '@app/hooks/airdrop/ws/useAirdropWebsocket.ts';
import Invite from './Invite.tsx';
import Gems from './Gems.tsx';
import User from './User.tsx';
import LogIn from './LogIn.tsx';
import Claim from './Claim.tsx';
import { Wrapper } from './items.style';
import { FEATURE_FLAGS as FF } from '@app/store/consts.ts';

function LoggedInItems() {
    const ff = useAirdropStore((s) => s.features);
    const claimEnabled = !ff?.includes(FF.FF_AD_KS) && ff?.includes(FF.FF_AD_CLAIM_ENABLED);
    useAirdropWebsocket();
    return (
        <>
            {claimEnabled ? (
                <Claim />
            ) : (
                <>
                    <Invite />
                    <Gems />
                </>
            )}
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

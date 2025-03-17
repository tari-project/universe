import Invite from './Invite.tsx';
import Gems from './Gems.tsx';
import User from './User.tsx';
import { Wrapper } from './items.style';
import { useAirdropStore } from '@app/store';
import LogIn from './LogIn.tsx';

export function AirdropSidebarItems() {
    const isLoggedIn = useAirdropStore((s) => !!s.airdropTokens);
    return (
        <Wrapper>
            {isLoggedIn ? (
                <>
                    <Invite />
                    <Gems />
                    <User />
                </>
            ) : (
                <LogIn />
            )}
        </Wrapper>
    );
}

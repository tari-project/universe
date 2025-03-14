import Invite from './Invite.tsx';
import Gems from './Gems.tsx';
import User from './User.tsx';
import { Wrapper } from './items.style';

export function AirdropSidebarItems() {
    return (
        <Wrapper>
            <Invite />
            <Gems />
            <User />
        </Wrapper>
    );
}

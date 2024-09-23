import { useEffect, useState } from 'react';
import Gems from '../../components/Gems/Gems';
import UserInfo from './segments/UserInfo/UserInfo';
import { UserRow, Wrapper } from './styles';
import { useAirdropStore } from '@app/store/useAirdropStore';
import Invite from './segments/Invite/Invite';

export default function LoggedIn() {
    const [gems, setGems] = useState(0);

    const { userDetails, userPoints } = useAirdropStore();

    useEffect(() => {
        setGems(userPoints?.base.gems || userDetails?.user?.rank?.gems || 0);
    }, [userPoints?.base.gems, userDetails?.user?.rank?.gems]);

    return (
        <Wrapper>
            <UserRow>
                <UserInfo />
                <Gems number={gems} label={`Gems`} />
            </UserRow>

            <Invite />
        </Wrapper>
    );
}

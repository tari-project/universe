import { useEffect, useState } from 'react';
import Gems from '../../components/Gems/Gems';
import UserInfo from './segments/UserInfo/UserInfo';
import { UserRow, Wrapper } from './styles';
import { useAirdropStore } from '@app/store/useAirdropStore';
import Invite from './segments/Invite/Invite';
import Flare from './segments/Flare/Flare';
import { AnimatePresence } from 'framer-motion';

export default function LoggedIn() {
    const [gems, setGems] = useState(0);

    const [showFlare, setShowFlare] = useState<'GoalComplete' | 'FriendAccepted' | 'BonusGems' | false>(false);

    const { userDetails, userPoints } = useAirdropStore();

    useEffect(() => {
        setGems(userPoints?.base.gems || userDetails?.user?.rank?.gems || 0);
    }, [userPoints?.base.gems, userDetails?.user?.rank?.gems]);

    const handleShowFlare = () => {
        setShowFlare('BonusGems');
    };

    useEffect(() => {
        if (showFlare) {
            const timeout = setTimeout(() => {
                setShowFlare(false);
            }, 3000);
            return () => {
                clearTimeout(timeout);
            };
        }
    }, [showFlare]);

    return (
        <Wrapper>
            <UserRow onClick={handleShowFlare}>
                <UserInfo />
                <Gems number={gems} label={`Gems`} />
            </UserRow>

            <Invite />

            <AnimatePresence>{showFlare && <Flare gems={2000} animationType={showFlare} />}</AnimatePresence>
        </Wrapper>
    );
}

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
        if (showFlare) {
            setShowFlare(false);
            return;
        }

        //setShowFlare('GoalComplete');
        setShowFlare('FriendAccepted');
        //setShowFlare('BonusGems');
    };

    return (
        <Wrapper>
            <UserRow onClick={handleShowFlare}>
                <UserInfo />
                <Gems number={gems} label={`Gems`} />
            </UserRow>

            <Invite />

            <AnimatePresence>
                {showFlare && (
                    <Flare
                        gems={2000}
                        animationType={showFlare}
                        onAnimationComplete={() => setShowFlare(false)}
                        onClick={() => setShowFlare(false)}
                    />
                )}
            </AnimatePresence>
        </Wrapper>
    );
}

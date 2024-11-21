import { useEffect, useMemo, useState } from 'react';
import Gems from '../../components/Gems/Gems';
import UserInfo from './segments/UserInfo/UserInfo';
import { UserRow, Wrapper } from './styles';
import { useAirdropStore, REFERRAL_GEMS } from '@app/store/useAirdropStore';
import Invite from './segments/Invite/Invite';
import Flare from './segments/Flare/Flare';
import { AnimatePresence } from 'framer-motion';

export default function LoggedIn() {
    const [gems, setGems] = useState(0);

    const {
        userDetails,
        userPoints,
        flareAnimationType,
        bonusTiers,
        setFlareAnimationType,
        referralQuestPoints,
        miningRewardPoints,
    } = useAirdropStore();

    useEffect(() => {
        setGems(userPoints?.base?.gems || userDetails?.user?.rank?.gems || 0);
    }, [userPoints?.base?.gems, userDetails?.user?.rank?.gems]);

    const bonusTier = useMemo(
        () =>
            bonusTiers
                ?.sort((a, b) => a.target - b.target)
                .find((t) => t.target == (userPoints?.base?.gems || userDetails?.user?.rank?.gems || 0)),
        [bonusTiers, userDetails?.user?.rank?.gems, userPoints?.base?.gems]
    );

    const flareGems = useMemo(() => {
        switch (flareAnimationType) {
            case 'GoalComplete':
                return bonusTier?.bonusGems || 0;
            case 'FriendAccepted':
                return referralQuestPoints?.pointsForClaimingReferral || REFERRAL_GEMS;
            case 'BonusGems':
                return miningRewardPoints?.reward || 0;
            default:
                return 0;
        }
    }, [
        flareAnimationType,
        bonusTier?.bonusGems,
        referralQuestPoints?.pointsForClaimingReferral,
        miningRewardPoints?.reward,
    ]);

    return (
        <Wrapper>
            <UserRow>
                <UserInfo />
                <Gems number={gems} label={`Gems`} />
            </UserRow>

            <Invite />

            <AnimatePresence>
                {flareAnimationType && (
                    <Flare
                        gems={flareGems}
                        animationType={flareAnimationType}
                        onAnimationComplete={() => setFlareAnimationType()}
                        onClick={() => setFlareAnimationType()}
                    />
                )}
            </AnimatePresence>
        </Wrapper>
    );
}

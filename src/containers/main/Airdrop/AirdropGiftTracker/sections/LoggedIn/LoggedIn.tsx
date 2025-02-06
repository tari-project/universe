import { useMemo } from 'react';
import Gems from '../../components/Gems/Gems';
import UserInfo from './segments/UserInfo/UserInfo';
import { UserRow, Wrapper } from './styles';
import { useAirdropStore, REFERRAL_GEMS } from '@app/store/useAirdropStore';
import Invite from './segments/Invite/Invite';
import Flare from './segments/Flare/Flare';
import { AnimatePresence } from 'motion/react';

export default function LoggedIn() {
    const { userRankGems, userPointsGems, flareAnimationType, bonusTiers, referralGems, miningRewardPoints } =
        useAirdropStore((s) => ({
            userRankGems: s.userDetails?.user?.rank?.gems,
            userPointsGems: s.userPoints?.base?.gems,
            flareAnimationType: s.flareAnimationType,
            bonusTiers: s.bonusTiers,
            referralGems: s.referralQuestPoints?.pointsForClaimingReferral || REFERRAL_GEMS,
            miningRewardPoints: s.miningRewardPoints,
        }));

    const bonusTier = useMemo(
        () =>
            bonusTiers
                ?.sort((a, b) => a.target - b.target)
                .find((t) => t.target == (userPointsGems || userRankGems || 0)),
        [bonusTiers, userRankGems, userPointsGems]
    );

    const flareGems = useMemo(() => {
        switch (flareAnimationType) {
            case 'GoalComplete':
                return bonusTier?.bonusGems || 0;
            case 'FriendAccepted':
                return referralGems;
            case 'BonusGems':
                return miningRewardPoints?.reward || 0;
            default:
                return 0;
        }
    }, [flareAnimationType, bonusTier?.bonusGems, referralGems, miningRewardPoints?.reward]);

    return (
        <Wrapper>
            <UserRow>
                <UserInfo />
                <Gems number={userPointsGems || userRankGems || 0} label={`Gems`} />
            </UserRow>

            <Invite />

            <AnimatePresence>
                {flareAnimationType ? <Flare gems={flareGems} animationType={flareAnimationType} /> : null}
            </AnimatePresence>
        </Wrapper>
    );
}

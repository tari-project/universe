import { useCrewRewardsStore } from '@app/store/useCrewRewardsStore';
import { AnimatePresence } from 'motion/react';
import { memo } from 'react';
import RewardsWidget from './RewardsWidget/RewardsWidget';

const CrewRewards = memo(function CrewRewards() {
    const showWidget = useCrewRewardsStore((s) => s.showWidget);

    return <AnimatePresence>{showWidget && <RewardsWidget />}</AnimatePresence>;
});

export default CrewRewards;

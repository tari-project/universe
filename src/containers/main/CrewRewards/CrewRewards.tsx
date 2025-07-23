import { useCrewRewardsStore } from '@app/store/useCrewRewardsStore';
import { AnimatePresence } from 'motion/react';
import { memo } from 'react';
import RewardsWidget from './RewardsWidget/RewardsWidget';
import { FEATURE_FLAGS } from '@app/store/consts';
import { useAirdropStore } from '@app/store';

const CrewRewards = memo(function CrewRewards() {
    const showWidget = useCrewRewardsStore((s) => s.showWidget);
    const crewRewardsEnabled = useAirdropStore((s) => s.features?.includes(FEATURE_FLAGS.FE_CREW_UI));

    //if (crewRewardsEnabled) return null;

    return <AnimatePresence>{showWidget && <RewardsWidget />}</AnimatePresence>;
});

export default CrewRewards;

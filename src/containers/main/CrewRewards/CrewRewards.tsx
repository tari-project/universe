import { useCrewRewardsStore } from '@app/store/useCrewRewardsStore';
import { AnimatePresence } from 'motion/react';
import { memo, useEffect } from 'react';
import RewardsWidget from './RewardsWidget/RewardsWidget';
import { FEATURE_FLAGS } from '@app/store/consts';
import { useAirdropStore, useUIStore } from '@app/store';

const CrewRewards = memo(function CrewRewards() {
    const showWidget = useCrewRewardsStore((s) => s.showWidget);
    const setShowWidget = useCrewRewardsStore((s) => s.setShowWidget);
    const crewRewardsEnabled = useAirdropStore((s) => s.features?.includes(FEATURE_FLAGS.FE_CREW_UI));
    const showTapplet = useUIStore((s) => s.showTapplet);
    const isShuttingDown = useUIStore((s) => s.isShuttingDown);

    useEffect(() => {
        if (crewRewardsEnabled) {
            setShowWidget(true);
        } else {
            setShowWidget(false);
        }
    }, [crewRewardsEnabled, setShowWidget]);

    if (isShuttingDown) return null;

    return <AnimatePresence>{showWidget && !showTapplet && <RewardsWidget />}</AnimatePresence>;
});
export default CrewRewards;

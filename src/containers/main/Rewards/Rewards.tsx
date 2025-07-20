import { useRewardsStore } from '@app/store/useRewardsStore.ts';
import { AnimatePresence } from 'motion/react';
import { memo } from 'react';
import RewardsWidget from './RewardsWidget/RewardsWidget';

const Rewards = memo(function Rewards() {
    const showWidget = useRewardsStore((s) => s.showWidget);

    return <AnimatePresence>{showWidget && <RewardsWidget />}</AnimatePresence>;
});
export default Rewards;

import CrewSection from './sections/CrewSection/CrewSection';
import MainSection from './sections/MainSection/MainSection';
import StreakProgress from './sections/StreakProgress/StreakProgress';

import { Holder, PositionWrapper, WidgetWrapper } from './styles';
import { useCrewRewardsStore } from '../../../../store/useCrewRewardsStore';
import { AnimatePresence } from 'motion/react';

export default function RewardsWidget() {
    const { isOpen } = useCrewRewardsStore();

    return (
        <PositionWrapper initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}>
            <Holder>
                <WidgetWrapper $isOpen={isOpen}>
                    <MainSection />
                    <AnimatePresence>{isOpen && <CrewSection />}</AnimatePresence>
                </WidgetWrapper>
                {!isOpen && <StreakProgress />}
            </Holder>
        </PositionWrapper>
    );
}

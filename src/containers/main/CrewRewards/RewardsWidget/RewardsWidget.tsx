import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import CrewSection from './sections/CrewSection/CrewSection';
import MainSection from './sections/MainSection/MainSection';
import StreakProgress from './sections/StreakProgress/StreakProgress';

import { Holder, PositionWrapper, WidgetWrapper } from './styles';
import { useCrewRewardsStore } from '../../../../store/useCrewRewardsStore';
import { AnimatePresence } from 'motion/react';
import { useAirdropStore } from '@app/store';
import LoginSection from './sections/LoginSection/LoginSection';
import MinimizedSection from './sections/MinimizedSection/MinimizedSection';

const introAnimation = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
};

export default function RewardsWidget() {
    const { t } = useTranslation();
    const { isOpen, setIsOpen, isMinimized } = useCrewRewardsStore();
    const isLoggedIn = useAirdropStore((s) => !!s.airdropTokens);

    if (isMinimized) {
        return (
            <PositionWrapper {...introAnimation}>
                <Holder>
                    <MinimizedSection />
                </Holder>
            </PositionWrapper>
        );
    }

    if (!isLoggedIn) {
        return (
            <PositionWrapper {...introAnimation}>
                <Holder>
                    <WidgetWrapper $isOpen={false} $isLogin={true}>
                        <LoginSection />
                    </WidgetWrapper>
                </Holder>
            </PositionWrapper>
        );
    }

    return (
        <PositionWrapper {...introAnimation}>
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

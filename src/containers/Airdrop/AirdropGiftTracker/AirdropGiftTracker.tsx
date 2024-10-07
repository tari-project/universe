import { useAirdropStore } from '@app/store/useAirdropStore';
import { Title, Wrapper, TitleWrapper, EarningsAnimationWrapper } from './styles';
import LoggedOut from './sections/LoggedOut/LoggedOut';
import LoggedIn from './sections/LoggedIn/LoggedIn';
import { useAirdropSyncState } from '@app/hooks/airdrop/useAirdropSyncState';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useTranslation } from 'react-i18next';
import InfoTooltip from './components/InfoTooltip/InfoTooltip';
import EarningsAnimation from '@app/containers/Airdrop/AirdropGiftTracker/components/Earnings/EarningsAnimation.tsx';
import { AnimatePresence } from 'framer-motion';

import { useCallback, useEffect, useRef, useState } from 'react';

export default function AirdropGiftTracker() {
    useAirdropSyncState();
    const { t } = useTranslation(['airdrop'], { useSuspense: false });
    const airdrop_ui_enabled = useAppConfigStore((s) => s.airdrop_ui_enabled);
    const [currentGems, setCurrentGems] = useState(0);
    const [gemEarnings, setGemEarnings] = useState(0);
    const prevGems = useRef(currentGems);

    const { airdropTokens, userDetails, userPoints } = useAirdropStore();

    useEffect(() => {
        if (!airdropTokens) return;
        const gems = userPoints?.base.gems || userDetails?.user?.rank?.gems || 0;
        prevGems.current = currentGems;
        setCurrentGems(gems);
    }, [airdropTokens, currentGems, userDetails?.user?.rank?.gems, userPoints?.base.gems]);

    useEffect(() => {
        if (!airdropTokens) return;
        if (currentGems > 0 && prevGems.current !== currentGems) {
            setGemEarnings(currentGems - prevGems.current);
        }
    }, [airdropTokens, currentGems]);

    const handleComplete = useCallback(() => {
        setGemEarnings(0);
    }, []);

    if (!airdrop_ui_enabled) return null;
    const isLoggedIn = !!airdropTokens;

    return (
        <Wrapper layout>
            {isLoggedIn && (
                <EarningsAnimationWrapper>
                    <AnimatePresence mode="wait">
                        {gemEarnings && (
                            <EarningsAnimation gemValue={gemEarnings} onAnimationComplete={handleComplete} />
                        )}
                    </AnimatePresence>
                </EarningsAnimationWrapper>
            )}
            <TitleWrapper>
                <Title>{t('airdropGame')}</Title>
                <InfoTooltip title={t('topTooltipTitle')} text={t('topTooltipText')} />
            </TitleWrapper>

            {isLoggedIn ? <LoggedIn /> : <LoggedOut />}
        </Wrapper>
    );
}

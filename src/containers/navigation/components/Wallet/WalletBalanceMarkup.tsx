import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'motion/react';
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import CharSpinner from '@app/components/CharSpinner/CharSpinner.tsx';

import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';

import {
    BalanceVisibilityButton,
    WalletBalance,
    WalletBalanceContainer,
    WalletBalanceWrapper,
} from './Wallet.styles.ts';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { useTariBalance } from '@app/hooks/wallet/useTariBalance.ts';
import SyncTooltip from './SyncTooltip/SyncTooltip.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { usePaperWalletStore } from '@app/store/usePaperWalletStore.ts';
import { toggleHideWalletBalance } from '@app/store/actions/uiStoreActions.ts';
import { useUIStore } from '@app/store';

export default function WalletBalanceMarkup() {
    const { t } = useTranslation('sidebar', { useSuspense: false });
    const hideWalletBalance = useUIStore((s) => s.hideWalletBalance);
    const setShowPaperWalletModal = usePaperWalletStore((s) => s.setShowModal);
    const handleSyncButtonClick = (e) => {
        e.stopPropagation();
        setShowPaperWalletModal(true);
    };
    const {
        balanceDisplayValue,
        formattedLongBalance,
        isWalletScanning,
        showLongBalance,
        shouldAnimateBalance,
        toggleBalanceFormat,
    } = useTariBalance();

    const sizingLong = useCallback(() => {
        const baseSize = 40;
        const step = 1.75;
        const maxLength = 20;
        const length = Math.min(formattedLongBalance.length, maxLength);
        if (length <= 9) return baseSize;
        return baseSize - (length - 6) * step;
    }, [formattedLongBalance.length]);
    const balanceVis = (
        <BalanceVisibilityButton onClick={toggleHideWalletBalance}>
            {!hideWalletBalance ? <IoEyeOffOutline size={14} /> : <IoEyeOutline size={14} />}
        </BalanceVisibilityButton>
    );

    return (
        <WalletBalanceContainer>
            <WalletBalanceWrapper
                onMouseOver={() => toggleBalanceFormat({ isMouseOver: true })}
                onMouseOut={() => toggleBalanceFormat({ isMouseOver: false })}
            >
                {!isWalletScanning ? (
                    <AnimatePresence mode="popLayout">
                        {!showLongBalance || hideWalletBalance || isWalletScanning ? (
                            <WalletBalance
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                key="compressed-number"
                            >
                                <CharSpinner
                                    value={balanceDisplayValue}
                                    variant="simple"
                                    fontSize={40}
                                    animateNumbers={shouldAnimateBalance}
                                />
                            </WalletBalance>
                        ) : (
                            <WalletBalance
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                key="full-number"
                            >
                                <CharSpinner
                                    value={formattedLongBalance}
                                    variant="simple"
                                    fontSize={sizingLong()}
                                    animateNumbers={shouldAnimateBalance}
                                />
                            </WalletBalance>
                        )}
                    </AnimatePresence>
                ) : (
                    <CircularProgress />
                )}
            </WalletBalanceWrapper>
            {balanceVis}
        </WalletBalanceContainer>
    );
}

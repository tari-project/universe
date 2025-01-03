import { useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import CharSpinner from '@app/components/CharSpinner/CharSpinner.tsx';
import { formatNumber, FormatPreset } from '@app/utils/formatters.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';

import { useWalletStore } from '@app/store/useWalletStore.ts';

import {
    BalanceVisibilityButton,
    WalletBalance,
    WalletBalanceContainer,
    WalletBalanceWrapper,
} from './Wallet.styles.ts';

export default function WalletBalanceMarkup() {
    const { t } = useTranslation('sidebar', { useSuspense: false });

    const balance = useWalletStore((s) => s.balance);
    const [showBalance, setShowBalance] = useState(true);
    const [showLongBalance, setShowLongBalance] = useState(false);
    const [animateNumbers, setShowAnimateNumbers] = useState(true);

    const formatted = formatNumber(balance || 0, FormatPreset.TXTM_COMPACT);
    const formattedLong = formatNumber(balance || 0, FormatPreset.TXTM_LONG);

    const sizingLong = useCallback(() => {
        const baseSize = 50;
        const step = 1.75;
        const maxLength = 20;
        const length = Math.min(formattedLong.length, maxLength);
        if (length <= 9) return baseSize;
        return baseSize - (length - 6) * step;
    }, [formattedLong.length]);

    const toggleBalanceVisibility = () => setShowBalance((prev) => !prev);
    const displayValue = balance === null ? '-' : showBalance ? formatted : '*****';

    const handleMouseOver = () => {
        setShowAnimateNumbers(false);
        setShowLongBalance(true);
    };

    const handleMouseOut = () => {
        setShowAnimateNumbers(false);
        setShowLongBalance(false);
    };

    useEffect(() => {
        if (!animateNumbers) {
            const timer = setTimeout(() => {
                setShowAnimateNumbers(true);
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [animateNumbers]);

    return (
        <WalletBalanceContainer>
            <Stack direction="row" alignItems="center">
                <Typography variant="span" style={{ fontSize: '15px' }}>
                    {t('wallet-balance')}
                </Typography>
                <BalanceVisibilityButton onClick={toggleBalanceVisibility}>
                    {showBalance ? (
                        <IoEyeOffOutline size={14} color="white" />
                    ) : (
                        <IoEyeOutline size={14} color="white" />
                    )}
                </BalanceVisibilityButton>
            </Stack>
            <WalletBalanceWrapper onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
                <AnimatePresence mode="popLayout">
                    {!showLongBalance || !showBalance ? (
                        <WalletBalance
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key="compressed-number"
                        >
                            <CharSpinner
                                value={displayValue}
                                variant="simple"
                                fontSize={50}
                                animateNumbers={animateNumbers}
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
                                value={formattedLong}
                                variant="simple"
                                fontSize={sizingLong()}
                                animateNumbers={animateNumbers}
                            />
                        </WalletBalance>
                    )}
                </AnimatePresence>
            </WalletBalanceWrapper>
        </WalletBalanceContainer>
    );
}

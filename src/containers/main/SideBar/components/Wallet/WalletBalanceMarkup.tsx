import { useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'motion/react';
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
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';

export default function WalletBalanceMarkup() {
    const { t } = useTranslation('sidebar', { useSuspense: false });

    const calculated_balance = useWalletStore((s) => s.calculated_balance);
    const [showBalance, setShowBalance] = useState(true);
    const [showLongBalance, setShowLongBalance] = useState(false);
    const [animateNumbers, setShowAnimateNumbers] = useState(true);

    const formatted = formatNumber(calculated_balance || 0, FormatPreset.TXTM_COMPACT);
    const formattedLong = formatNumber(calculated_balance || 0, FormatPreset.TXTM_LONG);

    const sizingLong = useCallback(() => {
        const baseSize = 50;
        const step = 1.75;
        const maxLength = 20;
        const length = Math.min(formattedLong.length, maxLength);
        if (length <= 9) return baseSize;
        return baseSize - (length - 6) * step;
    }, [formattedLong.length]);

    const toggleBalanceVisibility = () => setShowBalance((prev) => !prev);
    const isWalletScanning = !Number.isFinite(calculated_balance);
    const displayValue = isWalletScanning ? '-' : showBalance ? formatted : '*****';

    const handleMouseOver = useCallback(() => {
        if (isWalletScanning) return;

        setShowAnimateNumbers(false);
        setShowLongBalance(true);
    }, [isWalletScanning]);

    const handleMouseOut = useCallback(() => {
        if (isWalletScanning) return;

        setShowAnimateNumbers(false);
        setShowLongBalance(false);
    }, [isWalletScanning]);

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
                {!isWalletScanning ? (
                    <AnimatePresence mode="popLayout">
                        {!showLongBalance || !showBalance || isWalletScanning ? (
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
                ) : (
                    <CircularProgress />
                )}
            </WalletBalanceWrapper>
        </WalletBalanceContainer>
    );
}

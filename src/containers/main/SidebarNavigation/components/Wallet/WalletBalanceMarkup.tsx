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

export default function WalletBalanceMarkup() {
    const { t } = useTranslation('sidebar', { useSuspense: false });

    const {
        balanceDisplayValue,
        formattedLongBalance,
        isWalletScanning,
        showBalance,
        showLongBalance,
        shouldAnimateBalance,
        toggleBalanceVisibility,
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

    return (
        <WalletBalanceContainer>
            <Stack direction="row" alignItems="center">
                <Typography variant="span" style={{ fontSize: '11px' }}>
                    {t('wallet-balance')}
                </Typography>
                <BalanceVisibilityButton onClick={toggleBalanceVisibility}>
                    {showBalance ? <IoEyeOffOutline size={14} /> : <IoEyeOutline size={14} />}
                </BalanceVisibilityButton>
            </Stack>
            <WalletBalanceWrapper
                onMouseOver={() => toggleBalanceFormat({ isMouseOver: true })}
                onMouseOut={() => toggleBalanceFormat({ isMouseOver: false })}
            >
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
        </WalletBalanceContainer>
    );
}

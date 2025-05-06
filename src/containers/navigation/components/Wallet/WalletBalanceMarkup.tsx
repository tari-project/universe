import { memo, useCallback } from 'react';

import { AnimatePresence } from 'motion/react';
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import CharSpinner from '@app/components/CharSpinner/CharSpinner.tsx';

import {
    BalanceVisibilityButton,
    WalletBalance,
    WalletBalanceContainer,
    WalletBalanceWrapper,
} from './Wallet.styles.ts';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { useTariBalance } from '@app/hooks/wallet/useTariBalance.ts';
import { toggleHideWalletBalance } from '@app/store/actions/uiStoreActions.ts';
import { useUIStore } from '@app/store';

const WalletBalanceMarkup = memo(function WalletBalanceMarkup() {
    const hideWalletBalance = useUIStore((s) => s.hideWalletBalance);

    const {
        balanceDisplayValue,
        formattedLongBalance,
        isWalletScanning,
        showLongBalance,
        shouldAnimateBalance,
        toggleBalanceFormat,
    } = useTariBalance();

    const sizingLong = useCallback(() => {
        const baseSize = 34;
        const step = 1.15;
        const maxLength = 30;
        const length = Math.min(formattedLongBalance.length, maxLength);
        if (length <= 5) return baseSize;
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
                                    fontSize={34}
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
            {!isWalletScanning && balanceVis}
        </WalletBalanceContainer>
    );
});

export default WalletBalanceMarkup;

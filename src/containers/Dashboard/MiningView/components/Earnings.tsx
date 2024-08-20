import { AnimatePresence } from 'framer-motion';
import useWalletStore from '@app/store/walletStore.ts';

import { EarningsContainer, EarningsText } from './Earnings.styles.ts';
import formatBalance from '@app/utils/formatBalance.ts';
import { useEffect, useState } from 'react';
import useBalanceInfo from '@app/hooks/mining/useBalanceInfo.ts';

export default function Earnings() {
    const { hasEarned } = useBalanceInfo();
    const [earnings, setEarnings] = useState(0);

    const previousBalance = useWalletStore((state) => state.previousBalance);
    const balance = useWalletStore((state) => state.balance);

    useEffect(() => {
        if (hasEarned) {
            setEarnings(balance - previousBalance);
        }
    }, [balance, hasEarned, previousBalance]);

    return (
        <EarningsContainer>
            <AnimatePresence>
                {earnings !== 0 ? (
                    <EarningsText
                        variant="h1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 1 }}
                        onAnimationComplete={() => {
                            setEarnings(0);
                        }}
                    >
                        {formatBalance(earnings)}
                    </EarningsText>
                ) : null}
            </AnimatePresence>
        </EarningsContainer>
    );
}

import { AnimatePresence } from 'framer-motion';
import useWalletStore from '@app/store/walletStore.ts';

import { EarningsContainer, EarningsText, EarningsWrapper } from './Earnings.styles.ts';
import formatBalance from '@app/utils/formatBalance.ts';
import { useEffect, useState } from 'react';
import useBalanceInfo from '@app/hooks/mining/useBalanceInfo.ts';

const variants = {
    visible: {
        opacity: 1,
        y: 0,
        scale: 1.05,
        transition: {
            duration: 0.8,
            scale: {
                duration: 0.5,
            },
        },
    },
    hidden: {
        opacity: 0,
        y: 50,
        transition: { duration: 0.2, delay: 0.75 },
    },
};

export default function Earnings() {
    const { hasEarned } = useBalanceInfo();
    const [earnings, setEarnings] = useState(0);
    const [show, setShow] = useState(false);

    const previousBalance = useWalletStore((state) => state.previousBalance);
    const balance = useWalletStore((state) => state.balance);

    useEffect(() => {
        const difference = balance - previousBalance;
        setEarnings(difference);
        setShow(hasEarned && difference > 0);
    }, [balance, hasEarned, previousBalance]);

    return (
        <EarningsContainer>
            <AnimatePresence>
                {show ? (
                    <EarningsWrapper
                        initial="hidden"
                        variants={variants}
                        animate="visible"
                        exit="hidden"
                        onAnimationComplete={() => {
                            setShow(false);
                        }}
                    >
                        <span>you&apos;ve earned</span>
                        <EarningsText variant="h1">{formatBalance(earnings)}</EarningsText>
                        <span>XTR</span>
                    </EarningsWrapper>
                ) : null}
            </AnimatePresence>
        </EarningsContainer>
    );
}

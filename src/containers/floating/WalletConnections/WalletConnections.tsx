import { AnimatePresence } from 'motion/react';
import { SwapStep, useWalletStore } from '@app/store';
import { setReviewSwap, setWalletConnectModalStep } from '@app/store/actions/walletStoreActions';
import { m } from 'motion/react';

import { ConnectWallet } from './sections/ConnectWallet/ConnectWallet';
import { useCallback, useEffect, useMemo } from 'react';
import { WalletContents } from './sections/WalletContents/WalletContents';
import { Swap } from './sections/Swap/Swap';
import { SignMessage } from './sections/SignMessage/SignMessage';
import { ProcessingTransaction } from './sections/ProcessingTransaction/ProcessingTransaction';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { useAccount } from 'wagmi';

export const WalletConnections = () => {
    const reviewSwap = useWalletStore((state) => state.review_swap);
    const swapStep = useWalletStore((state) => state.swap_step);
    const { addresses } = useAccount();

    useEffect(() => {
        if (addresses && addresses.length > 0) {
            if (swapStep === SwapStep.ConnectWallet) {
                setWalletConnectModalStep(SwapStep.WalletContents);
            }
        } else if (swapStep !== SwapStep.ConnectWallet) {
            setWalletConnectModalStep(SwapStep.ConnectWallet);
        }
    }, [addresses, swapStep]);

    const stepMarkup = useMemo(() => {
        switch (swapStep) {
            case SwapStep.ConnectWallet:
                return <ConnectWallet />;
            case SwapStep.WalletContents:
                return <WalletContents />;
            case SwapStep.Swap:
                return <Swap />;
            case SwapStep.SignMessage:
                return <SignMessage />;
            case SwapStep.Progress:
                return <ProcessingTransaction />;
            default:
                return null;
        }
    }, [swapStep]);

    const getModalTitle = useCallback(() => {
        switch (swapStep) {
            case SwapStep.ConnectWallet:
                return 'Connect a Wallet';
            case SwapStep.WalletContents:
                return 'Wallet connected';
            case SwapStep.Swap:
                return 'Review';
            case SwapStep.SignMessage:
                return '';
            case SwapStep.Progress:
                return '';
            default:
                return '';
        }
    }, [swapStep]);

    return (
        <TransactionModal show={reviewSwap} title={getModalTitle()} handleClose={() => setReviewSwap(false)}>
            <AnimatePresence mode="wait">
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'linear' }}
                    key={swapStep}
                >
                    {stepMarkup}
                </m.div>
            </AnimatePresence>
        </TransactionModal>
    );
};

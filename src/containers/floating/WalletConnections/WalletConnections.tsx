import { AnimatePresence } from 'motion/react';
import { SwapStep, useWalletStore } from '@app/store';
import { setWalletConnectModalOpen, setWalletConnectModalStep } from '@app/store/actions/walletStoreActions';
import { WagmiProvider } from 'wagmi';
import { m } from 'motion/react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiAdapter } from './config/wagmi.config';
import { ConnectWallet } from './sections/ConnectWallet/ConnectWallet';
import { useAppKitAccount } from '@reown/appkit/react';
import { useCallback, useEffect, useMemo } from 'react';
import { WalletContents } from './sections/WalletContents/WalletContents';
import { Swap } from './sections/Swap/Swap';
import { SignMessage } from './sections/SignMessage/SignMessage';
import { ProcessingTransaction } from './sections/ProcessingTransaction/ProcessingTransaction';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';

const queryClient = new QueryClient();

export const WalletConnections = () => {
    const walletConnectionsModalIsOpen = useWalletStore((state) => state.wallet_connect_modal_open);
    const swapStep = useWalletStore((state) => state.swap_step);
    const { allAccounts } = useAppKitAccount({ namespace: 'eip155' });

    useEffect(() => {
        console.log('allAccounts', allAccounts);
        if (allAccounts && allAccounts.length > 0) {
            if (swapStep === SwapStep.ConnectWallet) {
                setWalletConnectModalStep(SwapStep.WalletContents);
            }
        } else if (swapStep !== SwapStep.ConnectWallet) {
            setWalletConnectModalStep(SwapStep.ConnectWallet);
        }
    }, [allAccounts, swapStep]);

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
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <TransactionModal
                    show={walletConnectionsModalIsOpen}
                    title={getModalTitle()}
                    handleClose={() => setWalletConnectModalOpen(false)}
                >
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
            </QueryClientProvider>
        </WagmiProvider>
    );
};

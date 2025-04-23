import { AnimatePresence } from 'motion/react';
import { IconContainer, TopArea, WalletConnectionOverlay, WalletConnectionsContainer } from './WalletConnections.style';
import '@reown/appkit-wallet-button/react';
import { SwapStep, useWalletStore } from '@app/store';
import { setWalletConnectModalOpen, setWalletConnectModalStep } from '@app/store/actions/walletStoreActions';
import { WagmiProvider } from 'wagmi';
import { m } from 'motion/react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiAdapter } from './config/wagmi.config';
import { CrossIcon } from '@app/components/svgs/crossIconSvg';
import { ConnectWallet } from './sections/ConnectWallet/ConnectWallet';
import { useAppKitAccount } from '@reown/appkit/react';
import { useEffect, useMemo } from 'react';
import { WalletContents } from './sections/WalletContents/WalletContents';
import { Swap } from './sections/Swap/Swap';

const queryClient = new QueryClient();

export const WalletConnections = () => {
    const walletConnectionsModalIsOpen = useWalletStore((state) => state.wallet_connect_modal_open);
    const swapStep = useWalletStore((state) => state.swap_step);
    const { allAccounts } = useAppKitAccount({ namespace: 'eip155' });

    useEffect(() => {
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
            default:
                return null;
        }
    }, [swapStep]);

    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <AnimatePresence>
                    {walletConnectionsModalIsOpen ? (
                        <WalletConnectionOverlay
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setWalletConnectModalOpen(false)}
                        >
                            <WalletConnectionsContainer
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                <TopArea>
                                    <IconContainer onClick={() => setWalletConnectModalOpen(false)}>
                                        <CrossIcon />
                                    </IconContainer>
                                </TopArea>
                                <AnimatePresence mode="wait">
                                    <m.div
                                        initial={{ x: '-100%' }}
                                        animate={{ x: 0 }}
                                        exit={{ x: '100%' }}
                                        transition={{ duration: 0.3, ease: 'linear' }}
                                        key={swapStep}
                                    >
                                        {stepMarkup}
                                    </m.div>
                                </AnimatePresence>
                            </WalletConnectionsContainer>
                        </WalletConnectionOverlay>
                    ) : null}
                </AnimatePresence>
            </QueryClientProvider>
        </WagmiProvider>
    );
};

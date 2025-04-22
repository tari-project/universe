import { AnimatePresence } from 'motion/react';
import { IconContainer, TopArea, WalletConnectionOverlay, WalletConnectionsContainer } from './WalletConnections.style';
import '@reown/appkit-wallet-button/react';
import { useWalletStore } from '@app/store';
import { setWalletConnectModalOpen } from '@app/store/actions/walletStoreActions';
import { WagmiProvider } from 'wagmi';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiAdapter } from './wagmi.config';
import { CrossIcon } from '@app/components/svgs/crossIconSvg';
import { ConnectAWallet } from './sections/ConnectAWallet';
import { useAppKitAccount } from '@reown/appkit/react';
import { useMemo } from 'react';
import { WalletContents } from './sections/WalletContents';

const queryClient = new QueryClient();

export const WalletConnections = () => {
    const walletConnectionsModalIsOpen = useWalletStore((state) => state.wallet_connect_modal_open);
    const { allAccounts } = useAppKitAccount({ namespace: 'eip155' });

    const stepMarkup = useMemo(() => {
        if (allAccounts.length === 0) {
            return <ConnectAWallet />;
        }
        return <WalletContents />;
    }, [allAccounts]);

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
                                initial={{ opacity: 0, y: -100 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -100 }}
                            >
                                <TopArea>
                                    <IconContainer onClick={() => setWalletConnectModalOpen(false)}>
                                        <CrossIcon />
                                    </IconContainer>
                                </TopArea>
                                {stepMarkup}
                            </WalletConnectionsContainer>
                        </WalletConnectionOverlay>
                    ) : null}
                </AnimatePresence>
            </QueryClientProvider>
        </WagmiProvider>
    );
};

import { AnimatePresence } from 'motion/react';
import { WalletConnectionOverlay, WalletConnectionsContainer } from './WalletConnections.style';
import { useWalletStore } from '@app/store';
import { setWalletConnectModalOpen } from '@app/store/actions/walletStoreActions';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiAdapter } from './wagmi.config';

// 0. Setup queryClient
const queryClient = new QueryClient();

export const WalletConnections = () => {
    const walletConnectionsModalIsOpen = useWalletStore((state) => state.wallet_connect_modal_open);
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
                            ></WalletConnectionsContainer>
                        </WalletConnectionOverlay>
                    ) : null}
                </AnimatePresence>
            </QueryClientProvider>
        </WagmiProvider>
    );
};

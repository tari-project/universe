import { AnimatePresence } from 'motion/react';
import {
    ContentWrapper,
    IconContainer,
    PortalCopy,
    PortalWrapper,
    TopArea,
    WalletConnectHeader,
    WalletConnectionOverlay,
    WalletConnectionsContainer,
} from './WalletConnections.style';
import '@reown/appkit-wallet-button/react';
import { useWalletStore } from '@app/store';
import { setWalletConnectModalOpen } from '@app/store/actions/walletStoreActions';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiAdapter } from './wagmi.config';
import { CrossIcon } from '@app/components/svgs/crossIconSvg';
import { Divider } from '@app/components/elements/Divider';
import { useAppKitWallet } from '@reown/appkit-wallet-button/react';
import MMFox from './icons/mm-fox';
import Phantom from './icons/phantom.png';
import Portal from './icons/portal.png';
import { useAppKitAccount } from '@reown/appkit/react';

// 0. Setup queryClient
const queryClient = new QueryClient();

export const WalletConnections = () => {
    const walletConnectionsModalIsOpen = useWalletStore((state) => state.wallet_connect_modal_open);
    const { allAccounts } = useAppKitAccount({ namespace: 'eip155' });
    const { connect } = useAppKitWallet({
        onSuccess() {
            // ...
        },
        onError(error) {
            // ...
        },
    });

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
                                    <IconContainer>
                                        <CrossIcon />
                                    </IconContainer>
                                </TopArea>
                                {allAccounts.length === 0 ? (
                                    <WalletConnectHeader>{'Connect a Wallet'}</WalletConnectHeader>
                                ) : (
                                    <>
                                        <WalletConnectHeader>{'Connected Wallets'}</WalletConnectHeader>
                                        {allAccounts.map((account) => (
                                            <TopArea key={account.address}>{account.address}</TopArea>
                                        ))}
                                    </>
                                )}
                                <ContentWrapper>
                                    <PortalWrapper>
                                        <img src={Portal} alt="Portal" width="40" />
                                        <PortalCopy>
                                            <h3>{'Portal Wallet'}</h3>
                                            <span>{'Available on iOS, Android and Chrome'}</span>
                                        </PortalCopy>
                                    </PortalWrapper>
                                    <Divider />
                                    <button onClick={() => connect('metamask')}>
                                        <MMFox width="30" />
                                        <span>{'Metamask'}</span>
                                    </button>
                                    <Divider />
                                    <button onClick={() => connect('phantom')}>
                                        <img src={Phantom} alt="Phantom" />
                                        <span>{'Phantom'}</span>
                                    </button>
                                </ContentWrapper>
                            </WalletConnectionsContainer>
                        </WalletConnectionOverlay>
                    ) : null}
                </AnimatePresence>
            </QueryClientProvider>
        </WagmiProvider>
    );
};

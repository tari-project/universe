import WalletSection from './sections/Wallet.tsx';
import MiningSection from './sections/Mining.tsx';
import { GridAreaBottom, GridAreaTop, WrapperGrid, SidebarWrapper, BuyOverlay } from './Sidebar.styles.ts';
import { useNodeStore, useWalletStore } from '@app/store';
import { AnimatePresence } from 'motion/react';

export default function Sidebar() {
    const isSwapping = useWalletStore((s) => s.is_swapping);
    const isWalletScanning = useWalletStore((s) => s.wallet_scanning?.is_scanning);
    const walletIsLoading = useWalletStore((s) => s.isLoading);
    const isConnectedToTariNetwork = useNodeStore((s) => s.isNodeConnected);

    const isLoading = !isConnectedToTariNetwork || isWalletScanning || walletIsLoading;
    return (
        <SidebarWrapper
            initial={{
                opacity: 0,
                left: -10,
            }}
            animate={{
                opacity: 1,
                left: 0,
            }}
            exit={{
                opacity: 0,
                left: -10,
            }}
        >
            <WrapperGrid>
                <GridAreaTop>
                    <MiningSection />
                </GridAreaTop>
                <AnimatePresence>
                    {isSwapping && (
                        <BuyOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                    )}
                </AnimatePresence>
                <GridAreaBottom $swapsOpen={isSwapping} $isLoading={isLoading}>
                    <WalletSection />
                </GridAreaBottom>
            </WrapperGrid>
        </SidebarWrapper>
    );
}

import MMFox from '../../icons/mm-fox';
import { useConnect } from 'wagmi';
import { useCallback, useEffect, useState } from 'react';
import {
    ConnectHeader,
    ConnectSubHeader,
    ContentWrapper,
    ConnectingProgress,
    GreenDot,
    LoadingCopy,
} from './RequestApproval.styles';
import { LoadingDots } from '../SignMessage/SignMessage.styles';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { AnimatePresence } from 'motion/react';
// import Portal from '../../icons/portal.png';

export const RequestApproval = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (isOpen: boolean) => void }) => {
    const { connect, connectors } = useConnect();
    const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false); // Track connection status

    const handleConnect = useCallback(async () => {
        const walletConnectConnector = connectors.find((c) => c.id === 'walletConnect'); // Or the correct ID Reown uses

        if (walletConnectConnector && isOpen) {
            // --- This is the speculative part ---
            // You need to find how Reown/Wagmi exposes the URI.
            // This is a common pattern but might differ.
            const provider = (await walletConnectConnector.getProvider()) as any;
            provider.on('display_uri', (uri: string) => {
                console.log('WalletConnect URI:', uri);
                setQrCodeUri(uri);
            });
            // --- End speculative part ---

            try {
                console.log('Attempting connection...');
                // This will trigger the 'display_uri' event above if the pattern holds
                const result = connect({ connector: walletConnectConnector });
                console.log('Connection successful:', result);
                setQrCodeUri(null); // Clear QR once connected
                setIsConnected(true);
            } catch (error) {
                console.error('Connection failed:', error);
                setQrCodeUri(null); // Clear QR on error
                setIsConnected(false);
            }
        } else {
            console.error('WalletConnect connector not found.');
        }
    }, [connect, connectors, isOpen]);

    useEffect(() => {
        if (!isConnected && !qrCodeUri) {
            handleConnect();
        }
    }, [handleConnect, isConnected, qrCodeUri]);

    useEffect(() => {
        if (!isOpen) {
            setIsConnected(false);
            setQrCodeUri(null);
        }
    }, [isOpen]);

    return (
        <TransactionModal show={isOpen} handleClose={() => setIsOpen(false)}>
            <AnimatePresence mode="wait">
                <ContentWrapper>
                    <MMFox width="100" />
                    <ConnectHeader>{'Connect to MetaMask'}</ConnectHeader>
                    <ConnectSubHeader>{'Scan the QR code to connect your wallet on your phone'}</ConnectSubHeader>
                    <ConnectingProgress>
                        <GreenDot />
                        <MMFox width="20" />
                        <LoadingCopy>
                            {'Waiting for connection'} <LoadingDots />
                        </LoadingCopy>
                    </ConnectingProgress>
                </ContentWrapper>
            </AnimatePresence>
        </TransactionModal>
    );
};

import MMFox from '../../icons/mm-fox';
import { useConnect } from 'wagmi';
import { useCallback, useEffect, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { ContentWrapper } from './ConnectWallet.styles';
import { LoadingDots } from '../SignMessage/SignMessage.styles';
// import Portal from '../../icons/portal.png';

export const ConnectWallet = () => {
    const { connect, connectors } = useConnect();
    const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false); // Track connection status

    const handleConnect = useCallback(async () => {
        const walletConnectConnector = connectors.find((c) => c.id === 'walletConnect'); // Or the correct ID Reown uses

        if (walletConnectConnector) {
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
    }, [connect, connectors]);

    useEffect(() => {
        if (!isConnected && !qrCodeUri) {
            handleConnect();
        }
    }, [handleConnect, isConnected, qrCodeUri]);

    return (
        <ContentWrapper>
            <MMFox width="100" />
            <span>{'Connect to MetaMask'}</span>
            <span>{'Scan the QR code to connect your wallet on your phone'}</span>
            {qrCodeUri ? <QRCode value={qrCodeUri} size={250} /> : <LoadingDots />}
        </ContentWrapper>
    );
};

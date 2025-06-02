import { useConnect } from 'wagmi';
import { Provider } from 'ethers';
import { useCallback, useEffect, useState } from 'react';

export const ConnectWallet = ({
    isOpen,
    setIsOpen,
    setError,
}: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    setError?: (error: string) => void;
}) => {
    const { connectors } = useConnect();
    const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const handleConnect = useCallback(async () => {
        if (!isOpen) {
            return;
        }

        const walletConnectConnector = connectors.find((c) => c.id === 'walletConnect');

        if (walletConnectConnector) {
            try {
                const provider = (await walletConnectConnector.getProvider()) as Provider;
                const handleUri = async (uri: string) => {
                    setQrCodeUri(uri);
                };

                const handleDisconnect = () => {
                    console.info('Disconnected from wallet');
                    setIsConnected(false);
                    setQrCodeUri(null);
                };

                provider.on('display_uri', (uri: string) => {
                    handleUri(uri);
                });

                provider.on('disconnect', handleDisconnect);

                provider.on('connect', (info: unknown) => {
                    console.info('connect', info);
                    setIsOpen(false);
                });

                provider.on('proposal_expire', () => {
                    setError?.(
                        'Wallet Connect failed. Please try again with a different Ethereum wallet. If you continue to face challenges, please connect with Tari contributors on Telegram or Discord.'
                    );
                });

                provider.on('error', (error: unknown) => {
                    console.info('connect', error);
                });

                const cleanup = () => {
                    provider.removeListener('display_uri', handleUri);
                    provider.removeListener('disconnect', handleDisconnect);
                };
                walletConnectConnector
                    .connect()
                    .then((r) => console.info(r))
                    .catch((e) => console.error('Error connecting to wallet:', e));
                // connect({ connector: walletConnectConnector });
                setQrCodeUri(null);
                setIsConnected(true);
                return cleanup;
            } catch (e) {
                console.error('Connection failed:', e);
                setQrCodeUri(null);
                setIsConnected(false);
                console.warn('Retrying connection in 3 seconds...');
                setTimeout(() => {
                    if (isOpen) {
                        handleConnect();
                    }
                }, 3000);
            }
        } else {
            console.error('WalletConnect connector not found.');
        }
    }, [connectors, isOpen, setError, setIsOpen]);

    useEffect(() => {
        if (!isConnected && !qrCodeUri) {
            const cleanup = handleConnect();
            return () => {
                cleanup.then((cleanupHandler) => cleanupHandler?.());
            };
        }
    }, [handleConnect, isConnected, qrCodeUri]);

    useEffect(() => {
        if (!isOpen) {
            setIsConnected(false);
            setQrCodeUri(null);
        }
    }, [isOpen]);
};

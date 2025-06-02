import MMFox from '../../icons/mm-fox';
import { useConnect } from 'wagmi';
import { Provider } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import {
    ConnectHeader,
    ConnectSubHeader,
    ContentWrapper,
    QrWrapper,
    LoadingQrInner,
    ConnectingProgress,
    GreenDot,
    LoadingCopy,
} from './ConnectWallet.styles';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { useTranslation } from 'react-i18next';
import LoadingDots from '@app/components/elements/loaders/LoadingDots';

export const ConnectWallet = ({
    isOpen,
    setIsOpen,
    setError: _setError,
}: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    setError?: (error: string) => void;
}) => {
    const { connectors } = useConnect();
    const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { t } = useTranslation(['wallet'], { useSuspense: false });

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
    }, [connectors, isOpen, setIsOpen]);

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

    return (
        <TransactionModal show={isOpen} handleClose={() => setIsOpen(false)}>
            <ContentWrapper>
                <MMFox width="100" />
                <ConnectHeader>{t('swap.connect-wallet')}</ConnectHeader>
                <ConnectSubHeader>{t('swap.scan-qr-code')}</ConnectSubHeader>
                <QrWrapper>
                    {qrCodeUri ? (
                        <QRCode value={qrCodeUri} size={180} />
                    ) : (
                        <LoadingQrInner
                            animate={{
                                backgroundPosition: ['-200%', '200%'],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 2,
                                ease: 'linear',
                            }}
                        />
                    )}
                </QrWrapper>
                <ConnectingProgress>
                    <GreenDot />
                    <MMFox width="20" />
                    <LoadingCopy>{t('swap.connect-wallet-text')}</LoadingCopy>
                    <LoadingDots />
                </ConnectingProgress>
            </ContentWrapper>
        </TransactionModal>
    );
};

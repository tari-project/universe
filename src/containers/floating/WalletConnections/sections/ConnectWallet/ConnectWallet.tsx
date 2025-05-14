import MMFox from '../../icons/mm-fox';
import { useConnect } from 'wagmi';
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
import { LoadingDots } from '../SignMessage/SignApprovalMessage.styles';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

export const ConnectWallet = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (isOpen: boolean) => void }) => {
    const { connect, connectors } = useConnect();
    const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false); // Track connection status
    const { t } = useTranslation(['wallet'], { useSuspense: false });

    const handleConnect = useCallback(async () => {
        const walletConnectConnector = connectors.find((c) => c.id === 'walletConnect'); // Or the correct ID Reown uses

        if (walletConnectConnector && isOpen) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const provider = (await walletConnectConnector.getProvider()) as any;
            provider.on('display_uri', (uri: string) => {
                setQrCodeUri(uri);
            });
            try {
                connect({ connector: walletConnectConnector });
                setQrCodeUri(null); // Clear QR once connected
                setIsConnected(true);
            } catch (e) {
                console.error('Connection failed:', e);
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
                        <LoadingCopy>
                            {t('swap.connect-wallet-text')} <LoadingDots />
                        </LoadingCopy>
                    </ConnectingProgress>
                </ContentWrapper>
            </AnimatePresence>
        </TransactionModal>
    );
};

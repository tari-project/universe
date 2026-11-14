import { QRCode } from 'react-qrcode-logo';
import { useTranslation } from 'react-i18next';
import TransactionModal from '@app/components/TransactionModal/TransactionModal';
import { WalletButton } from '../../components/WalletButton/WalletButton';
import { CopyRow, HeaderWrapper, QRWrapper } from './WalletConnectDialog.styles';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard';

interface Props {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    /** WalletConnect pairing URI (wc:...) sent by the swap iframe. */
    uri?: string | null;
}

/**
 * In-app WalletConnect panel. The swap iframe renders its own QR, but on some
 * phones the camera app cannot resolve the wc: scheme, so we re-render the
 * pairing URI here as a scannable QR and offer a copyable link that can be
 * pasted straight into a mobile wallet's WalletConnect prompt.
 */
export const WalletConnectDialog = ({ isOpen, setIsOpen, uri }: Props) => {
    const { t } = useTranslation(['wallet', 'common'], { useSuspense: false });
    const { copyToClipboard, isCopied } = useCopyToClipboard();

    const hasUri = typeof uri === 'string' && uri.startsWith('wc:');

    return (
        <TransactionModal show={isOpen} handleClose={() => setIsOpen(false)} noHeader>
            <HeaderWrapper>
                <h3>{t('swap.connect-wallet')}</h3>
                {hasUri ? (
                    <>
                        <p>{t('swap.scan-qr-code')}</p>
                        <QRWrapper data-testid="walletconnect-qr">
                            <QRCode value={uri} ecLevel="H" size={220} quietZone={10} id="WalletConnect QR Code" />
                        </QRWrapper>
                        <CopyRow>
                            <WalletButton variant="primary" size="xl" onClick={() => copyToClipboard(uri)}>
                                {isCopied ? t('common:copied') : t('swap.copy-link')}
                            </WalletButton>
                        </CopyRow>
                    </>
                ) : (
                    <p>{t('swap.connect-not-supported')}</p>
                )}
            </HeaderWrapper>
        </TransactionModal>
    );
};

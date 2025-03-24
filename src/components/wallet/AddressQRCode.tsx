import { QRContainer } from './Address.style.ts';
import { useMiningStore, usePaperWalletStore, useWalletStore } from '@app/store';
import { QRCode } from 'react-qrcode-logo';
import { Button } from '@app/components/elements/buttons/Button';
import { useTranslation } from 'react-i18next';
import SyncTooltip from '@app/containers/navigation/components/Wallet/SyncTooltip/SyncTooltip.tsx';

export function AddressQRCode() {
    const { t } = useTranslation('sidebar');
    const setShowPaperWalletModal = usePaperWalletStore((s) => s.setShowModal);
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const network = useMiningStore((state) => state.network);

    return (
        <QRContainer>
            <QRCode
                value={`tari://${network}/transactions/send?tariAddress=${walletAddress}`}
                ecLevel="L"
                size={400}
                id="Tari Address QR Code"
                quietZone={15}
                logoImage={'/assets/img/tari-outline.svg'}
                logoPaddingStyle={'circle'}
                logoPadding={18}
                qrStyle="dots"
                removeQrCodeBehindLogo={true}
                eyeRadius={20}
                style={{ borderRadius: 10, width: '100%', height: '100%' }}
            />

            <SyncTooltip
                title={t('paper-wallet-tooltip-title')}
                text={t('paper-wallet-tooltip-message')}
                trigger={
                    <Button fluid onClick={() => setShowPaperWalletModal(true)}>
                        {t('paper-wallet-button')}
                    </Button>
                }
            />
        </QRContainer>
    );
}

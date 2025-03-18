import { QRContainer } from './Address.style.ts';
import { useMiningStore, useWalletStore } from '@app/store';
import { QRCode } from 'react-qrcode-logo';

export function AddressQRCode() {
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
        </QRContainer>
    );
}

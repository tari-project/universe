import { QRCode } from 'react-qrcode-logo';
import { useTheme } from 'styled-components';
import { SB_WIDTH } from '@app/theme/styles.ts';
import { QRContainer } from './Address.style.ts';
import { useMiningStore, useWalletStore } from '@app/store';

export function AddressQRCode() {
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const theme = useTheme();

    const network = useMiningStore((state) => state.network);

    return (
        <QRContainer>
            <QRCode
                value={`tari://${network}/transactions/send?tariAddress=${walletAddress}`}
                size={SB_WIDTH - 80}
                ecLevel="M"
                id="Tari Address QR Code"
                quietZone={10}
                bgColor={theme.palette.base}
                fgColor={theme.palette.contrast}
                logoImage={'/assets/img/yat_hand.png'}
                logoPaddingStyle={'circle'}
                logoPadding={2}
                qrStyle="dots"
                removeQrCodeBehindLogo={true}
                eyeRadius={10}
                style={{ borderRadius: 10 }}
            />
        </QRContainer>
    );
}

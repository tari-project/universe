import { QRContainer, QROutside, QRSizer } from './Address.style.ts';
import { useMiningStore, useWalletStore } from '@app/store';
import { QRCode } from 'react-qrcode-logo';
import { Address } from './Address.tsx';

interface Props {
    useEmoji: boolean;
    setUseEmoji: (c: boolean) => void;
}

export function AddressQRCode({ useEmoji, setUseEmoji }: Props) {
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const network = useMiningStore((state) => state.network);

    return (
        <QRContainer>
            <QROutside>
                <QRSizer>
                    <QRCode
                        value={`tari://${network}/transactions/send?tariAddress=${walletAddress}`}
                        ecLevel="H"
                        size={400}
                        id="Tari Address QR Code"
                        quietZone={20}
                        logoImage={'/assets/img/tari-outline.svg'}
                        logoPaddingStyle={'circle'}
                        logoPadding={14}
                        qrStyle="dots"
                        removeQrCodeBehindLogo={true}
                        eyeRadius={12}
                        style={{ width: '100%', height: '100%' }}
                    />
                </QRSizer>
            </QROutside>

            <Address useEmoji={useEmoji} setUseEmoji={setUseEmoji} />
        </QRContainer>
    );
}

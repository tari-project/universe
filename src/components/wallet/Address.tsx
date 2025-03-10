import { QRCodeSVG } from 'qrcode.react';
import { useMiningStore, useWalletStore } from '@app/store';
import { AddressContainer, AddressWrapper, QRContainer } from './Address.style.ts';
import { SB_WIDTH } from '@app/theme/styles.ts';
import { truncateMiddle } from '@app/utils';
function Address() {
    const network = useMiningStore((state) => state.network);
    const walletAddress = useWalletStore((state) => state.tari_address_base58);

    const displayAddress = truncateMiddle(walletAddress, 8);
    return (
        <AddressWrapper>
            <AddressContainer title={walletAddress}>{displayAddress}</AddressContainer>
            <QRContainer>
                <QRCodeSVG
                    value={`tari://${network}/transactions/send?tariAddress=${walletAddress}`}
                    size={SB_WIDTH - 120}
                    level="M"
                    title="Tari Address QR Code"
                    marginSize={4}
                    imageSettings={{
                        src: 'assets/img/tari-outline.svg',
                        width: 60,
                        height: 60,
                        excavate: true,
                    }}
                />
            </QRContainer>
        </AddressWrapper>
    );
}

export { Address };

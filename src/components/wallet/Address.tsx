import { QRCodeSVG } from 'qrcode.react';
import { useMiningStore, useWalletStore } from '@app/store';
import { AddressContainer, AddressWrapper, Wrapper, QRContainer } from './Address.style.ts';
import { SB_WIDTH } from '@app/theme/styles.ts';
import { truncateMiddle } from '@app/utils';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useCopyToClipboard } from '@app/hooks';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';

function Address() {
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const network = useMiningStore((state) => state.network);
    const walletAddress = useWalletStore((state) => state.tari_address_base58);

    const displayAddress = truncateMiddle(walletAddress, 10);

    function handleCopyClick() {
        copyToClipboard(walletAddress);
    }
    return (
        <Wrapper>
            <AddressContainer>
                <Typography variant="p">{`My Address`}</Typography>
                <AddressWrapper>
                    <Typography title={walletAddress} variant="h4">
                        {displayAddress}
                    </Typography>
                    <IconButton size="small" onClick={handleCopyClick}>
                        {!isCopied ? <IoCopyOutline /> : <IoCheckmarkOutline />}
                    </IconButton>
                </AddressWrapper>
            </AddressContainer>
            <QRContainer>
                <QRCodeSVG
                    value={`tari://${network}/transactions/send?tariAddress=${walletAddress}`}
                    size={SB_WIDTH - 40}
                    level="H"
                    title="Tari Address QR Code"
                    marginSize={4}
                    imageSettings={{
                        src: 'assets/img/logo_round.png',
                        width: 60,
                        height: 60,
                        excavate: false,
                    }}
                />
            </QRContainer>
        </Wrapper>
    );
}

export { Address };

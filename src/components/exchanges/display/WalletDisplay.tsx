import {
    AddressDisplay,
    AddressWrapper,
    HeaderSection,
    ImgWrapper,
    OpenButton,
    WalletDisplayWrapper,
    XCInfo,
} from './wallet.styles.ts';
import { useState } from 'react';
import { useExchangeStore } from '@app/store/useExchangeStore.ts';
import { useWalletStore } from '@app/store';
import { truncateMiddle } from '@app/utils';
import { ChevronSVG } from '@app/assets/icons/chevron.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

export default function WalletDisplay() {
    const data = useExchangeStore((s) => s.content);
    const address = useWalletStore((s) => s.tari_address_emoji);
    const [open, setOpen] = useState(false);

    const displayAddress = truncateMiddle(address, 6);

    return data?.exchange_id ? (
        <WalletDisplayWrapper>
            <HeaderSection>
                <XCInfo>
                    <ImgWrapper $isLogo>
                        <img src={data.logo_img_url} alt={`${data.name} logo`} />
                    </ImgWrapper>
                    <Typography variant="h5">{data.name}</Typography>
                </XCInfo>
                <OpenButton
                    onClick={() => setOpen(!open)}
                    $isOpen={open}
                    aria-label="Open Wallet"
                    aria-expanded={open ? 'true' : 'false'}
                >
                    <ImgWrapper $border>
                        <ChevronSVG />
                    </ImgWrapper>
                </OpenButton>
            </HeaderSection>
            <AddressWrapper $isOpen={open} animate={{ height: open ? 'auto' : 0 }} initial={false}>
                <AddressDisplay>{displayAddress}</AddressDisplay>
            </AddressWrapper>
        </WalletDisplayWrapper>
    ) : null;
}

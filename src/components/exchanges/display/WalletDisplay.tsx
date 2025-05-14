import {
    AddressDisplay,
    AddressWrapper,
    HeaderSection,
    ImgWrapper,
    OpenButton,
    WalletDisplayWrapper,
    XCInfo,
} from './wallet.styles.ts';
import { ChevronSVG } from '@app/assets/icons/chevron.tsx';
import { useState } from 'react';
import { useExchangeStore } from '@app/store/useExchangeStore.ts';
import { useWalletStore } from '@app/store';
import { truncateMiddle } from '@app/utils';

export default function WalletDisplay() {
    const data = useExchangeStore((s) => s.content);
    // TODO: check `is_tari_address_generated` once #2105 is merged
    const address = useWalletStore((s) => s.tari_address_emoji);
    const [open, setOpen] = useState(false);

    const displayAddress = truncateMiddle(address, 6);

    return data ? (
        <WalletDisplayWrapper>
            <HeaderSection>
                <XCInfo>
                    <ImgWrapper $isLogo>
                        <img src={data.logo_img_url} alt={`${data.name} logo`} />
                    </ImgWrapper>
                    <p>{data.name}</p>
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

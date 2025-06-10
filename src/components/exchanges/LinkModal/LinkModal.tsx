import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';

import { useExchangeStore } from '@app/store/useExchangeStore.ts';
import { ImgWrapper, ListWrapper } from '@app/components/exchanges/commonStyles.ts';
import {
    CloseButton,
    CloseWrapper,
    HeaderWrapper,
    InfoWrapper,
    LinkButton,
    OptionWrapper,
    Subtitle,
    Title,
    Wrapper,
} from './styles.ts';
import { ExternalLinkSVG } from '@app/assets/icons/external-link.tsx';
import { IoClose } from 'react-icons/io5';

export default function XCLinkModal() {
    const { t } = useTranslation(['wallet']);
    const exchangeMiners = useExchangeStore((s) => s.exchangeMiners);

    const listMarkup = exchangeMiners?.map((x) => {
        const logoSrc = x.logo_img_small_url || x.logo_img_url;
        const url = x.listing_url || 'https://tari.com';
        return (
            <OptionWrapper key={x.id}>
                <InfoWrapper>
                    {logoSrc && (
                        <ImgWrapper $isLogo $col1={x.primary_colour}>
                            <img src={logoSrc} alt={x.name} />
                        </ImgWrapper>
                    )}
                    {x.name}
                </InfoWrapper>
                {url && (
                    <LinkButton onClick={() => open(url)}>
                        <ExternalLinkSVG />
                    </LinkButton>
                )}
            </OptionWrapper>
        );
    });
    return (
        <Dialog open={true}>
            <DialogContent $transparentBg $unPadded>
                <Wrapper>
                    <CloseWrapper>
                        <CloseButton>
                            <IoClose />
                        </CloseButton>
                    </CloseWrapper>
                    <HeaderWrapper>
                        <Title>{t('swap.buy-tari')}</Title>
                        <Subtitle>{t('swap.buy-tari-subtitle')}</Subtitle>
                    </HeaderWrapper>
                    <ListWrapper>{listMarkup}</ListWrapper>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}

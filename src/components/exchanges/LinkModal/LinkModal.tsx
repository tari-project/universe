import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';

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
import { setDialogToShow, useUIStore } from '@app/store';
import { useFetchExchangeList } from '@app/hooks/exchanges/fetchExchanges.ts';

export default function XCLinkModal() {
    const { t } = useTranslation(['wallet']);
    const { data: exchangeMiners } = useFetchExchangeList();
    const dialog = useUIStore((s) => s.dialogToShow);
    const isOpen = dialog === 'xc_url' && !!exchangeMiners?.some((x) => x.exchange_url);

    function handleClose() {
        setDialogToShow(null);
    }
    const listMarkup = exchangeMiners?.map((x) => {
        const logoSrc = x.logo_img_small_url || x.logo_img_url;
        const url = x.exchange_url;
        if (!url) return null;
        return (
            <OptionWrapper key={x.id} onClick={() => open(url)}>
                <InfoWrapper>
                    {logoSrc && (
                        <ImgWrapper>
                            <img src={logoSrc} alt={x.name} />
                        </ImgWrapper>
                    )}
                    {x.name}
                </InfoWrapper>

                <LinkButton>
                    <ExternalLinkSVG />
                </LinkButton>
            </OptionWrapper>
        );
    });
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent variant="transparent">
                <Wrapper>
                    <CloseWrapper>
                        <CloseButton onClick={handleClose}>
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

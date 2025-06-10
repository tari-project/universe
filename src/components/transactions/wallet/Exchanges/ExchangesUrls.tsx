import { useExchangeStore } from '@app/store/useExchangeStore.ts';
import {
    ChevronCTA,
    CopyWrapper,
    SectionDivider,
    Subtitle,
    Title,
    XCButton,
    XCLogo,
    XCLogos,
    XCWrapper,
} from './styles.ts';
import { ChevronSVG } from '@app/assets/icons/chevron.tsx';
import { setDialogToShow } from '@app/store';
import { useTranslation } from 'react-i18next';

export default function ExchangesUrls() {
    const { t } = useTranslation('wallet');
    const exchanges = useExchangeStore((s) => s.exchangeMiners);
    return exchanges?.length && !!exchanges?.some((x) => x.exchange_url) ? (
        <XCWrapper>
            <SectionDivider>
                <p>{t('xc.or')}</p>
            </SectionDivider>
            <XCButton onClick={() => setDialogToShow('xc_url')}>
                <XCLogos>
                    {exchanges.slice(0, 3)?.map((x, i) => {
                        const logoSrc = x.logo_img_small_url || x.logo_img_url;
                        return (
                            <XCLogo key={x.id} $index={i} $bgColour={x.primary_colour}>
                                <img src={logoSrc} alt={x.name} />
                            </XCLogo>
                        );
                    })}
                </XCLogos>
                <CopyWrapper>
                    <Title>{t('xc.buy-tari')}</Title>
                    <Subtitle>{t('xc.buy-tari-subtitle')}</Subtitle>
                </CopyWrapper>
                <ChevronCTA>
                    <ChevronSVG />
                </ChevronCTA>
            </XCButton>
        </XCWrapper>
    ) : null;
}

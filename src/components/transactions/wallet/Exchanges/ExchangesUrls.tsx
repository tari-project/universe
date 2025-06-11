import { useExchangeStore } from '@app/store/useExchangeStore.ts';
import { ChevronSVG } from '@app/assets/icons/chevron.tsx';
import { setDialogToShow } from '@app/store';
import { useTranslation } from 'react-i18next';
import { Logos } from './logos/Logos.tsx';
import { ChevronCTA, CopyWrapper, SectionDivider, Subtitle, Title, XCButton, XCWrapper } from './styles.ts';

export default function ExchangesUrls() {
    const { t } = useTranslation('wallet');
    const exchanges = useExchangeStore((s) => s.exchangeMiners);

    return exchanges?.length && !!exchanges?.some((x) => x.exchange_url) ? (
        <XCWrapper>
            <SectionDivider>
                <p>{t('xc.or')}</p>
            </SectionDivider>
            <XCButton onClick={() => setDialogToShow('xc_url')}>
                <Logos exchanges={exchanges} />
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

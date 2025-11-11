import { ChevronSVG } from '@app/assets/icons/chevron.tsx';
import { setDialogToShow } from '@app/store';
import { useTranslation } from 'react-i18next';
import { Logos } from './logos/Logos.tsx';
import { ChevronCTA, CopyWrapper, SectionDivider, Subtitle, Title, XCButton, XCWrapper } from './styles.ts';
import { useFetchExchangeList } from '@app/hooks/exchanges/fetchExchanges.ts';
import { Typography } from '@app/components/elements/Typography.tsx';

export default function ExchangesUrls() {
    const { t } = useTranslation('wallet');
    const { data: exchanges } = useFetchExchangeList();

    return exchanges?.length && !!exchanges?.some((x) => x.exchange_url) ? (
        <XCWrapper>
            <SectionDivider>
                <Typography variant="p">{t('xc.or')}</Typography>
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

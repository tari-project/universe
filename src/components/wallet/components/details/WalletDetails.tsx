import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import WalletCardActions from './actions/WalletCardActions.tsx';
import { Actions, DetailsLeft, LogoWrapper, Name, Wrapper } from './styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';

export default function WalletDetails() {
    const { data } = useFetchExchangeBranding();
    const name = data?.name;
    const logoSrc = data?.logo_img_small_url ?? data?.logo_img_url;
    const { t } = useTranslation('wallet');

    return (
        <Wrapper>
            <DetailsLeft>
                {logoSrc ? (
                    <LogoWrapper>
                        <img src={logoSrc} alt={`${name} logo`} />
                    </LogoWrapper>
                ) : null}
                <Name>{name}</Name>
            </DetailsLeft>
            <Actions>
                <div
                    style={{
                        borderRadius: '85px',
                        border: '1px solid #DDDDDD0D',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(154px)',
                        padding: '9px 10px 9px 10px',
                    }}
                >
                    <Typography variant="p" style={{ fontSize: '10px' }}>
                        {t('xc.mining-here')}
                    </Typography>
                </div>
                <WalletCardActions />
            </Actions>
        </Wrapper>
    );
}

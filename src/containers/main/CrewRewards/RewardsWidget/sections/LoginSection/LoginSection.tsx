import { useTranslation, Trans } from 'react-i18next';
import { BonusText, CoinsBg, LoginButton, Text, Title, Wrapper } from './styles';
import { useAirdropAuth } from '@app/hooks/airdrop/utils/useAirdropAuth';
import coinsBg from '../../../images/coin_login_bg.png';

export default function LoginSection() {
    const { t } = useTranslation();
    const { handleAuth } = useAirdropAuth();

    const userReward = 100;
    const friendReward = 50;
    const maxWeeks = 10;

    return (
        <>
            <CoinsBg src={coinsBg} alt="" aria-hidden={true} />
            <Wrapper>
                <Title>
                    <Trans i18nKey="airdrop:crewRewards.login.title" />
                </Title>

                <Text>
                    <Trans i18nKey="airdrop:crewRewards.login.description" values={{ userReward, friendReward }} />
                </Text>

                <BonusText>{t('airdrop:crewRewards.login.bonusText', { maxWeeks })}</BonusText>

                <LoginButton onClick={() => handleAuth()}>
                    <span>{t('airdrop:crewRewards.login.loginButton')}</span>
                </LoginButton>
            </Wrapper>
        </>
    );
}

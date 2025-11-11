import { useTranslation, Trans } from 'react-i18next';
import { BonusText, CoinsBg, CoinsBg2, LoginButton, MinimizePosition, Text, Title, Wrapper } from './styles';
import { useAirdropAuth } from '@app/hooks/airdrop/utils/useAirdropAuth';
import MinimizeButton from '../MainSection/segments/TopRow/MinimizeButton/MinimizeButton';
import coinsBg from '../../../images/coin_login_bg.png';
import coinsBg2 from '../../../images/coin_login_bg2.png';

export default function LoginSection() {
    const { t } = useTranslation();
    const { handleAuth } = useAirdropAuth();

    const userReward = 100;
    const friendReward = 50;
    const maxWeeks = 10;

    return (
        <>
            <CoinsBg src={coinsBg} alt="" aria-hidden={true} />
            <CoinsBg2 src={coinsBg2} alt="" aria-hidden={true} />
            <MinimizePosition>
                <MinimizeButton />
            </MinimizePosition>
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

import { useCrewRewardsStore } from '@app/store/useCrewRewardsStore';
import { IconImage, Title, Wrapper } from './styles';
import coinImage from '../../../images/coin_solo.png';
import { useTranslation } from 'react-i18next';

export default function MinimizedSection() {
    const { setIsMinimized } = useCrewRewardsStore();
    const { t } = useTranslation();

    const handleClick = () => {
        setIsMinimized(false);
    };

    return (
        <Wrapper type="button" onClick={handleClick}>
            <Title>
                <IconImage src={coinImage} alt="" aria-hidden="true" /> {t('airdrop:crewRewards.title')}
            </Title>
        </Wrapper>
    );
}

import { Wrapper } from './styles';
import gemImage from '../../images/gem-green.png';
import { useTranslation } from 'react-i18next';

export default function Prize() {
    const { t } = useTranslation('sos', { useSuspense: false });

    return (
        <Wrapper>
            <img src={gemImage} alt="" />
            {t('widget.prize.upcomingReward')}
        </Wrapper>
    );
}

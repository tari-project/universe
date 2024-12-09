import { useTranslation } from 'react-i18next';
import GrowCrew from '@app/containers/main/ShellOfSecrets/SoSWidget/segments/Friends/GrowCrew/GrowCrew';
import { Divider, LeftSide, Mining, Rate, SectionTitle, TopRow, Wrapper } from './styles';
import GreenArrowIcon from './icons/GreenArrowIcon';
import CrewList from './CrewList/CrewList';

export default function CrewMining() {
    const { t } = useTranslation('sos', { useSuspense: false });
    const miningRate = 45;
    const currentMiners = 6;
    const totalMiners = 32;

    return (
        <Wrapper>
            <TopRow>
                <LeftSide>
                    <SectionTitle>{t('crewMining.title')}</SectionTitle>
                    <Divider />
                    <Rate>{t('crewMining.rate', { rate: miningRate })}</Rate>
                    <Mining>
                        {t('crewMining.mining', { current: currentMiners, total: totalMiners })}
                        <GreenArrowIcon />
                    </Mining>
                </LeftSide>
                <GrowCrew />
            </TopRow>

            <CrewList />
        </Wrapper>
    );
}

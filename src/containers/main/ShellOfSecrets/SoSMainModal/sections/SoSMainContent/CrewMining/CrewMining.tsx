import { useTranslation } from 'react-i18next';
import GrowCrew from '@app/containers/main/ShellOfSecrets/SoSWidget/segments/Friends/GrowCrew/GrowCrew';
import {
    Divider,
    LeftSide,
    Mining,
    SectionTitle,
    TopRow,
    Wrapper,
    // Rate,
} from './styles';
import GreenArrowIcon from './icons/GreenArrowIcon';
import CrewList from './CrewList/CrewList';
import { useShellOfSecretsStore } from '@app/store/useShellOfSecretsStore';

export default function CrewMining() {
    const { t } = useTranslation('sos', { useSuspense: false });
    const { referrals } = useShellOfSecretsStore();
    // const miningRate = 45;
    const totalActiveReferrals = referrals?.totalActiveReferrals || 0;
    const totalReferrals = referrals?.totalReferrals || 0;

    return (
        <Wrapper>
            <TopRow>
                <LeftSide>
                    <SectionTitle>{t('crewMining.title')}</SectionTitle>
                    <Divider />
                    {/* <Rate>{t('crewMining.rate', { rate: miningRate })}</Rate> */}
                    <Mining>
                        {t('crewMining.mining', { current: totalActiveReferrals, total: totalReferrals })}
                        <GreenArrowIcon />
                    </Mining>
                </LeftSide>
                <GrowCrew />
            </TopRow>

            <CrewList />
        </Wrapper>
    );
}

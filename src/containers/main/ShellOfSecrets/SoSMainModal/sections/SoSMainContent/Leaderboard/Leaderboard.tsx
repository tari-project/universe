import { useTranslation } from 'react-i18next';
import LeaderboardList from './LeaderboardList/LeaderboardList';
// import Progress from './Progress/Progress';
import { Wrapper, TopRow, SectionTitle, Button } from './styles';

export default function Leaderboard() {
    const { t } = useTranslation('sos', { useSuspense: false });

    return (
        <Wrapper>
            <TopRow>
                <SectionTitle>{t('leaderboard.title')}</SectionTitle>
                <Button>{t('leaderboard.viewFull')}</Button>
            </TopRow>

            {/* <Progress /> */}

            <LeaderboardList />
        </Wrapper>
    );
}

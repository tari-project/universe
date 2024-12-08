/* eslint-disable i18next/no-literal-string */
import LeaderboardList from './segments/LeaderboardList/LeaderboardList';
import Progress from './segments/Progress/Progress';
import { Wrapper, TopRow, SectionTitle, Button } from './styles';

export default function Leaderboard() {
    return (
        <Wrapper>
            <TopRow>
                <SectionTitle>Leaderboard</SectionTitle>
                <Button>VIEW full LEADERBOARD</Button>
            </TopRow>

            <Progress />

            <LeaderboardList />
        </Wrapper>
    );
}

import CrewMining from './segments/CrewMining/CrewMining';
import Drops from './segments/Drops/Drops';
import Leaderboard from './segments/Leaderboard/Leaderboard';
import { Wrapper } from './styles';

export default function SoSMainContent() {
    return (
        <Wrapper>
            <CrewMining />
            <Leaderboard />
            <Drops />
        </Wrapper>
    );
}

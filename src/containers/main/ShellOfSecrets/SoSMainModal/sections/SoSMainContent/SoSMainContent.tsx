import CrewMining from './CrewMining/CrewMining';
import Drops from './Drops/Drops';
import Leaderboard from './Leaderboard/Leaderboard';
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

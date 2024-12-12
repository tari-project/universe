import CrewMining from './CrewMining/CrewMining';
import PrizeDrops from './PrizeDrops/PrizeDrops';
import Leaderboard from './Leaderboard/Leaderboard';
import { Wrapper } from './styles';

export default function SoSMainContent() {
    return (
        <Wrapper>
            <CrewMining />
            <Leaderboard />
            <PrizeDrops />
        </Wrapper>
    );
}

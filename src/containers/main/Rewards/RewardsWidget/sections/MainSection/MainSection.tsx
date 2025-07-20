import StatsRow from './segments/StatsRow/StatsRow';
import StreakMessage from './segments/StreakMessage/StreakMessage';
import TopRow from './segments/TopRow/TopRow';
import { Wrapper } from './styles';

export default function MainSection() {
    return (
        <Wrapper>
            <TopRow />
            <StatsRow />
            <StreakMessage />
        </Wrapper>
    );
}

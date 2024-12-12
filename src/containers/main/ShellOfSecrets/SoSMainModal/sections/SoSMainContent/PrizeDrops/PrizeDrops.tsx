import MacbookDrop from './Drops/MacbookDrop';
import UpcomingDrop from './Drops/UpcomingDrop';
import { Wrapper } from './styles';

export default function PrizeDrops() {
    return (
        <Wrapper>
            <MacbookDrop />
            <UpcomingDrop />
        </Wrapper>
    );
}

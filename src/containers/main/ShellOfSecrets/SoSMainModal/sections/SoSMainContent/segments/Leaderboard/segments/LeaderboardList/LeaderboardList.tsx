import { Wrapper } from './styles';
import LeaserboardEntry from './LeaserboardEntry/LeaserboardEntry';
import { data } from './data';

export default function LeaderboardList() {
    return (
        <Wrapper>
            {data.entries.map((entry, index) => (
                <LeaserboardEntry key={index} entry={entry} $current={index === 2} />
            ))}
        </Wrapper>
    );
}

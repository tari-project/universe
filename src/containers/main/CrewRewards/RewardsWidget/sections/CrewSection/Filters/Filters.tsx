import FilterButton from './FilterButton/FilterButton';
import { Wrapper } from './styles';

export default function Filters() {
    return (
        <Wrapper>
            <FilterButton isActive={true} text={`All`} number={28} />
            <FilterButton isActive={false} text={`Complete`} number={3} />
            <FilterButton isActive={false} text={`Active`} number={12} />
            <FilterButton isActive={false} text={`Inactive`} number={1} />
        </Wrapper>
    );
}

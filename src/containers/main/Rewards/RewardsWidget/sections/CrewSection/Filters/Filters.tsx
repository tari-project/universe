import FilterButton from './FilterButton/FilterButton';
import { Wrapper } from './styles';

interface Props {
    totals?: {
        all: number;
        completed: number;
        active: number;
        inactive: number;
    };
    activeFilter: 'all' | 'completed' | 'active' | 'inactive';
    onFilterChange: (filter: 'all' | 'completed' | 'active' | 'inactive') => void;
}

export default function Filters({ totals, activeFilter, onFilterChange }: Props) {
    return (
        <Wrapper>
            <FilterButton
                isActive={activeFilter === 'all'}
                text="All"
                number={totals?.all || 0}
                onClick={() => onFilterChange('all')}
            />
            <FilterButton
                isActive={activeFilter === 'completed'}
                text="Complete"
                number={totals?.completed || 0}
                onClick={() => onFilterChange('completed')}
            />
            <FilterButton
                isActive={activeFilter === 'active'}
                text="Active"
                number={totals?.active || 0}
                onClick={() => onFilterChange('active')}
            />
            <FilterButton
                isActive={activeFilter === 'inactive'}
                text="Inactive"
                number={totals?.inactive || 0}
                onClick={() => onFilterChange('inactive')}
            />
        </Wrapper>
    );
}

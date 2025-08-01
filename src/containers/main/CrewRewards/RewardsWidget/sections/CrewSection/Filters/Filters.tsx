import FilterButton from './FilterButton/FilterButton';
import { Wrapper } from './styles';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();

    return (
        <Wrapper>
            <FilterButton
                isActive={activeFilter === 'all'}
                text={t('airdrop:crewRewards.filters.all')}
                number={totals?.all || 0}
                onClick={() => onFilterChange('all')}
            />
            <FilterButton
                isActive={activeFilter === 'completed'}
                text={t('airdrop:crewRewards.filters.complete')}
                number={totals?.completed || 0}
                onClick={() => onFilterChange('completed')}
            />
            <FilterButton
                isActive={activeFilter === 'active'}
                text={t('airdrop:crewRewards.filters.active')}
                number={totals?.active || 0}
                onClick={() => onFilterChange('active')}
            />
            <FilterButton
                isActive={activeFilter === 'inactive'}
                text={t('airdrop:crewRewards.filters.inactive')}
                number={totals?.inactive || 0}
                onClick={() => onFilterChange('inactive')}
            />
        </Wrapper>
    );
}

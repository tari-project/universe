import FilterButton from './FilterButton/FilterButton';
import { Wrapper } from './styles';
import { useTranslation } from 'react-i18next';

interface Props {
    totals?: {
        active: number;
        inactive: number;
    };
    activeFilter: 'all' | 'completed' | 'active' | 'inactive';
    onFilterChange: (filter: 'active' | 'inactive') => void;
}

export default function Filters({ totals, activeFilter, onFilterChange }: Props) {
    const { t } = useTranslation();

    return (
        <Wrapper>
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

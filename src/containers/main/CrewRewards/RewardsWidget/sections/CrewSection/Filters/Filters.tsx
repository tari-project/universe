import FilterButton from './FilterButton/FilterButton';
import { Wrapper } from './styles';
import { useTranslation } from 'react-i18next';

export default function Filters() {
    const { t } = useTranslation();

    return (
        <Wrapper>
            <FilterButton isActive={true} text={t('airdrop:crewRewards.filters.all')} number={28} />
            <FilterButton isActive={false} text={t('airdrop:crewRewards.filters.complete')} number={3} />
            <FilterButton isActive={false} text={t('airdrop:crewRewards.filters.active')} number={12} />
            <FilterButton isActive={false} text={t('airdrop:crewRewards.filters.inactive')} number={1} />
        </Wrapper>
    );
}

import { useCrewMembers } from '@app/hooks/crew/useCrewMembers';
import { useAirdropStore } from '@app/store';
import { setCrewQueryParams } from '@app/store/actions/airdropStoreActions';
import CrewList from './CrewList/CrewList';
import Filters from './Filters/Filters';
import { IntroTextWrapper, Text, Title, Wrapper } from './styles';

export default function CrewSection() {
    const { data, isLoading, error, refetch } = useCrewMembers();

    console.log(data);

    // Get current filter state from store (query params only)
    const activeFilter = useAirdropStore((state) => state.crewQueryParams.status);

    const handleFilterChange = (status: 'all' | 'completed' | 'active' | 'inactive') => {
        setCrewQueryParams({ status, page: 1 }); // Reset to page 1 when filter changes
    };

    return (
        <Wrapper>
            <IntroTextWrapper>
                <Title>{`My Crew`}</Title>
                <Text>
                    {`Earn `}
                    <strong>{`100 XTM`}</strong>
                    {` for every `}
                    <strong>{`7 days`}</strong>
                    {` your friend mines. Your friend will also earn `}
                    <strong>{`50 XTM`}</strong>
                    {`.`}
                </Text>
            </IntroTextWrapper>

            <Filters totals={data?.totals} activeFilter={activeFilter} onFilterChange={handleFilterChange} />

            <CrewList members={data?.members || []} isLoading={isLoading} error={error} onRefresh={refetch} />
        </Wrapper>
    );
}

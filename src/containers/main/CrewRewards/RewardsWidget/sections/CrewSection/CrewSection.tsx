import { useCrewMembers } from '@app/hooks/crew/useCrewMembers';
import { useAirdropStore } from '@app/store';
import { setCrewQueryParams } from '@app/store/actions/airdropStoreActions';
import StreakProgress from '../StreakProgress/StreakProgress';
import CrewList from './CrewList/CrewList';
import Filters from './Filters/Filters';
import { IntroTextWrapper, Text, Title, Wrapper } from './styles';
import { useTranslation, Trans } from 'react-i18next';

export default function CrewSection() {
    const { t } = useTranslation();
    const { data, isLoading, error, refetch } = useCrewMembers();

    // Get current filter state from store (query params only)
    const activeFilter = useAirdropStore((state) => state.crewQueryParams.status);

    const handleFilterChange = (status: 'all' | 'completed' | 'active' | 'inactive') => {
        setCrewQueryParams({ status, page: 1 }); // Reset to page 1 when filter changes
    };

    return (
        <Wrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <StreakProgress isInline={true} />

            <IntroTextWrapper>
                <Title>{t('airdrop:crewRewards.myCrew')}</Title>
                <Text>
                    <Trans
                        i18nKey="airdrop:crewRewards.earnDescription"
                        values={{
                            userReward: 100,
                            daysRequired: 7,
                            friendReward: 50,
                        }}
                    />
                </Text>
            </IntroTextWrapper>

            <Filters totals={data?.totals} activeFilter={activeFilter} onFilterChange={handleFilterChange} />

            <CrewList
                isFiltered={activeFilter !== 'all'}
                members={data?.members || []}
                minRequirements={data?.minRequirements}
                isLoading={isLoading}
                error={error}
                onRefresh={refetch}
            />
        </Wrapper>
    );
}

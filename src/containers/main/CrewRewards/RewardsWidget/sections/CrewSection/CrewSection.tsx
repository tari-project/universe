import { useCrewMembers } from '@app/hooks/crew/useCrewMembers';
import { useReferrerProgress } from '@app/hooks/crew/useReferrerProgress';
import { useAirdropStore } from '@app/store';
import { setCrewQueryParams } from '@app/store/actions/airdropStoreActions';
import StreakProgress from '../StreakProgress/StreakProgress';
import CrewList from './CrewList/CrewList';
import Filters from './Filters/Filters';
import { IntroTextWrapper, Text, Title, Wrapper } from './styles';
import { useTranslation, Trans } from 'react-i18next';

export default function CrewSection() {
    const { t } = useTranslation();
    const {
        data: membersData,
        isLoading: membersLoading,
        error: membersError,
        refetch: refetchMembers,
        // Pagination controls
        nextPage,
        prevPage,
        // Pagination metadata
        currentPage,
        totalPages,
        totalItems,
        pageSize,
        hasNextPage,
        hasPrevPage,
    } = useCrewMembers();

    const {
        data: progressData,
        isLoading: progressLoading,
        error: progressError,
        refetch: refetchProgress,
    } = useReferrerProgress();

    // Get current filter state from store (query params only)
    const activeFilter = useAirdropStore((state) => state.crewQueryParams.status);

    const handleFilterChange = (status: 'active' | 'inactive') => {
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

            <Filters totals={progressData?.totals} activeFilter={activeFilter} onFilterChange={handleFilterChange} />

            <CrewList
                members={membersData?.members || []}
                minRequirements={progressData?.minRequirements}
                membersToNudge={progressData?.membersToNudge || []}
                isLoading={membersLoading || progressLoading}
                error={membersError || progressError}
                onRefresh={async () => {
                    await Promise.all([refetchMembers(), refetchProgress()]);
                }}
                // Pagination props
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                onNextPage={nextPage}
                onPrevPage={prevPage}
            />
        </Wrapper>
    );
}

import CrewDivider from './CrewDivider/CrewDivider';
import CrewEntry from './CrewEntry/CrewEntry';
import { Inside, ListGroup, MessageButton, MessageText, MessageWrapper, OuterWrapper, Wrapper } from './styles';
import { useTranslation } from 'react-i18next';
import type { CrewMember, MinRequirements, ReferrerProgressResponse } from '@app/store/useAirdropStore';
import { transformCrewMemberToEntry } from '@app/containers/main/CrewRewards/crewTransformers';
import CrewEntrySkeleton from './CrewEntrySkeleton/CrewEntrySkeleton';
import PaginationControls from './PaginationControls/PaginationControls';

interface Props {
    members: CrewMember[];
    membersToNudge: ReferrerProgressResponse['membersToNudge'];
    minRequirements?: MinRequirements;
    isLoading: boolean;
    isFiltered?: boolean;
    error: Error | null;
    onRefresh: () => Promise<void>;
    // Pagination props
    currentPage?: number;
    totalPages?: number;
    totalItems?: number;
    pageSize?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
    onNextPage?: () => void;
    onPrevPage?: () => void;
}

export default function CrewList({
    members,
    membersToNudge,
    minRequirements,
    isLoading,
    error,
    onRefresh,
    isFiltered = true,
    // Pagination props
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    pageSize = 20,
    hasNextPage = false,
    hasPrevPage = false,
    onNextPage,
    onPrevPage,
}: Props) {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <OuterWrapper>
                <Wrapper>
                    <Inside>
                        {[...Array(5)].map((_, i) => (
                            <CrewEntrySkeleton key={i} />
                        ))}
                    </Inside>
                </Wrapper>
            </OuterWrapper>
        );
    }

    if (error || !members) {
        return (
            <OuterWrapper>
                <Wrapper>
                    <Inside>
                        <MessageWrapper>
                            <MessageText>{error?.message ?? 'Failed to fetch crew members'}</MessageText>
                            <MessageButton onClick={() => onRefresh()} type="button">
                                {'Retry'}
                            </MessageButton>
                        </MessageWrapper>
                    </Inside>
                </Wrapper>
            </OuterWrapper>
        );
    }

    // Transform API data to UI format
    const transformedEntries = members?.map((member) =>
        transformCrewMemberToEntry(
            member,
            minRequirements || {
                minDailyMiningMinutes: 60,
                totalDaysRequired: 7,
                minShares: 0,
                minHashes: 0,
                minAmtPaid: BigInt(0),
            }
        )
    );

    const isEmpty = transformedEntries.length === 0 && membersToNudge.length === 0;

    if (isFiltered) {
        return (
            <OuterWrapper>
                <Wrapper>
                    <Inside>
                        {isEmpty ? (
                            <MessageWrapper>
                                <MessageText>{'No crew members found'}</MessageText>
                            </MessageWrapper>
                        ) : (
                            <>
                                <ListGroup>
                                    {transformedEntries.map((item) => (
                                        <CrewEntry key={item.id} entry={item} isClaimed={item.isClaimed} />
                                    ))}
                                </ListGroup>
                                {totalPages > 1 && onNextPage && onPrevPage && (
                                    <PaginationControls
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalItems={totalItems}
                                        pageSize={pageSize}
                                        hasNextPage={hasNextPage}
                                        hasPrevPage={hasPrevPage}
                                        onNextPage={onNextPage}
                                        onPrevPage={onPrevPage}
                                    />
                                )}
                            </>
                        )}
                    </Inside>
                </Wrapper>
            </OuterWrapper>
        );
    }

    // Filter by status for UI organization
    const completedList = transformedEntries?.filter((item) => item.progress === 100);
    const inProgressList = transformedEntries?.filter((item) => item.progress < 100 && item.status !== 'needs_nudge');
    const needsNudgeList = transformedEntries?.filter((item) => item.status === 'needs_nudge');

    return (
        <OuterWrapper>
            <Wrapper>
                <Inside>
                    {isEmpty ? (
                        <MessageWrapper>
                            <MessageText>{'No crew members found'}</MessageText>
                        </MessageWrapper>
                    ) : (
                        <>
                            {completedList.length > 0 && (
                                <>
                                    <CrewDivider text={t('airdrop:crewRewards.crewStatus.completed')} />
                                    <ListGroup>
                                        {completedList.map((item) => (
                                            <CrewEntry key={item.id} entry={item} isClaimed={item.isClaimed} />
                                        ))}
                                    </ListGroup>
                                </>
                            )}

                            {inProgressList.length > 0 && (
                                <>
                                    <CrewDivider text={t('airdrop:crewRewards.crewStatus.inProgress')} />
                                    <ListGroup>
                                        {inProgressList.map((item) => (
                                            <CrewEntry
                                                key={item.id}
                                                entry={item}
                                                minDaysRequired={minRequirements?.totalDaysRequired}
                                            />
                                        ))}
                                    </ListGroup>
                                </>
                            )}

                            {(needsNudgeList.length > 0 || membersToNudge.length > 0) && (
                                <CrewDivider text={t('airdrop:crewRewards.crewStatus.needsNudge')} />
                            )}

                            {needsNudgeList.length > 0 && (
                                <ListGroup>
                                    {needsNudgeList.map((item) => (
                                        <CrewEntry key={item.id} entry={item} />
                                    ))}
                                </ListGroup>
                            )}

                            {membersToNudge.length > 0 && (
                                <ListGroup>
                                    {membersToNudge.map((item, index) => (
                                        <CrewEntry
                                            key={`${item?.id || index}-${item?.name}`}
                                            entry={{
                                                ...item,
                                                id: item?.id || '',
                                                memberId: item?.id,
                                                claimableRewardId: undefined,
                                                handle: item?.name || '',
                                                user: {
                                                    avatar: item?.imageUrl || '',
                                                    isOnline: false,
                                                },
                                                progress: 0,
                                                status: 'needs_nudge',
                                            }}
                                        />
                                    ))}
                                </ListGroup>
                            )}
                        </>
                    )}
                </Inside>
            </Wrapper>
        </OuterWrapper>
    );
}

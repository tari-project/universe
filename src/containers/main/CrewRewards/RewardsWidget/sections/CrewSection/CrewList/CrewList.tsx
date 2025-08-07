import CrewDivider from './CrewDivider/CrewDivider';
import CrewEntry from './CrewEntry/CrewEntry';
import { Inside, ListGroup, MessageButton, MessageText, MessageWrapper, OuterWrapper, Wrapper } from './styles';
import { useTranslation } from 'react-i18next';
import type { CrewMember, CrewMembersResponse, MinRequirements } from '@app/store/useAirdropStore';
import type { RefetchOptions, QueryObserverResult } from '@tanstack/react-query';
import { transformCrewMemberToEntry } from '@app/containers/main/CrewRewards/crewTransformers';
import CrewEntrySkeleton from './CrewEntrySkeleton/CrewEntrySkeleton';

interface Props {
    members: CrewMember[];
    minRequirements?: MinRequirements;
    isLoading: boolean;
    isFiltered?: boolean;
    error: Error | null;
    onRefresh: (options?: RefetchOptions) => Promise<QueryObserverResult<CrewMembersResponse, Error>>;
}

export default function CrewList({ members, minRequirements, isLoading, error, onRefresh, isFiltered = false }: Props) {
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

    const isEmpty = transformedEntries.length === 0;

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
                                            <CrewEntry key={item.id} entry={item} />
                                        ))}
                                    </ListGroup>
                                </>
                            )}

                            {needsNudgeList.length > 0 && (
                                <>
                                    <CrewDivider text={t('airdrop:crewRewards.crewStatus.needsNudge')} />
                                    <ListGroup>
                                        {needsNudgeList.map((item) => (
                                            <CrewEntry key={item.id} entry={item} />
                                        ))}
                                    </ListGroup>
                                </>
                            )}
                        </>
                    )}
                </Inside>
            </Wrapper>
        </OuterWrapper>
    );
}

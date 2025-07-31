import CrewDivider from './CrewDivider/CrewDivider';
import CrewEntry from './CrewEntry/CrewEntry';
import { Inside, ListGroup, MessageButton, MessageText, MessageWrapper, OuterWrapper, Wrapper } from './styles';
import { useTranslation } from 'react-i18next';
import type { CrewMember, CrewMembersResponse } from '@app/store/useAirdropStore';
import type { RefetchOptions, QueryObserverResult } from '@tanstack/react-query';
import { transformCrewMemberToEntry } from '@app/containers/main/CrewRewards/crewTransformers';
import CrewEntrySkeleton from './CrewEntrySkeleton/CrewEntrySkeleton';

interface Props {
    members: CrewMember[];
    isLoading: boolean;
    error: Error | null;
    onRefresh: (options?: RefetchOptions) => Promise<QueryObserverResult<CrewMembersResponse, Error>>;
}

export default function CrewList({ members, isLoading, error, onRefresh }: Props) {
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
    const transformedEntries = members?.map(transformCrewMemberToEntry);

    // Filter by status for UI organization
    const completedList = transformedEntries?.filter((item) => item.status === 'completed');
    const inProgressList = transformedEntries?.filter((item) => item.status === 'in_progress');
    const needsNudgeList = transformedEntries?.filter((item) => item.status === 'needs_nudge');

    const isEmpty = !completedList.length && !inProgressList.length && !needsNudgeList.length;

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
                            <CrewDivider text={t('airdrop:crewRewards.crewStatus.completed')} />
                            <ListGroup>
                                {completedList.map((item) => (
                                    <CrewEntry key={item.id} entry={item} isClaimed={item.isClaimed} />
                                ))}
                            </ListGroup>

                            <CrewDivider text={t('airdrop:crewRewards.crewStatus.inProgress')} />
                            <ListGroup>
                                {inProgressList.map((item) => (
                                    <CrewEntry key={item.id} entry={item} />
                                ))}
                            </ListGroup>

                            <CrewDivider text={t('airdrop:crewRewards.crewStatus.needsNudge')} />
                            <ListGroup>
                                {needsNudgeList.map((item) => (
                                    <CrewEntry key={item.id} entry={item} />
                                ))}
                            </ListGroup>
                        </>
                    )}
                </Inside>
            </Wrapper>
        </OuterWrapper>
    );
}

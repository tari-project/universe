import CrewDivider from './CrewDivider/CrewDivider';
import CrewEntry from './CrewEntry/CrewEntry';
import { Inside, ListGroup, OuterWrapper, Wrapper } from './styles';
import { useTranslation } from 'react-i18next';
import type { CrewMember, CrewMembersResponse } from '@app/store/useAirdropStore';
import type { RefetchOptions, QueryObserverResult } from '@tanstack/react-query';
import { transformCrewMemberToEntry } from '@app/containers/main/CrewRewards/crewTransformers';

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
                        <div>{'Loading crew members...'}</div>
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
                        <div>{error?.message ?? 'Failed to fetch crew members'}</div>
                        <button onClick={() => onRefresh()}>{'Retry'}</button>
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

    return (
        <OuterWrapper>
            <Wrapper>
                <Inside>
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
                </Inside>
            </Wrapper>
        </OuterWrapper>
    );
}

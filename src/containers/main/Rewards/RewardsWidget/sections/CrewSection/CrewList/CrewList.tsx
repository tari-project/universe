import { transformCrewMemberToEntry } from './utils/crewTransformers';
import type { CrewMember } from '@app/store/useAirdropStore';
import CrewDivider from './CrewDivider/CrewDivider';
import CrewEntry from './CrewEntry/CrewEntry';
import { Inside, ListGroup, OuterWrapper, Wrapper } from './styles';

interface Props {
    members: CrewMember[];
    isLoading: boolean;
    error: Error | null;
    onRefresh: () => void;
}

export default function CrewList({ members, isLoading, error, onRefresh }: Props) {
    if (isLoading) {
        return (
            <OuterWrapper>
                <Wrapper>
                    <Inside>
                        <div>Loading crew members...</div>
                    </Inside>
                </Wrapper>
            </OuterWrapper>
        );
    }

    if (error) {
        return (
            <OuterWrapper>
                <Wrapper>
                    <Inside>
                        <div>{error.message}</div>
                        <button onClick={onRefresh}>{'Retry'}</button>
                    </Inside>
                </Wrapper>
            </OuterWrapper>
        );
    }

    // Transform API data to UI format
    const transformedEntries = members.map(transformCrewMemberToEntry);

    // Filter by status for UI organization
    const completedList = transformedEntries.filter((item) => item.status === 'completed');
    const inProgressList = transformedEntries.filter((item) => item.status === 'in_progress');
    const needsNudgeList = transformedEntries.filter((item) => item.status === 'needs_nudge');

    return (
        <OuterWrapper>
            <Wrapper>
                <Inside>
                    <CrewDivider text="Completed" />
                    <ListGroup>
                        {completedList.map((item) => (
                            <CrewEntry key={item.id} entry={item} />
                        ))}
                    </ListGroup>

                    <CrewDivider text="In Progress" />
                    <ListGroup>
                        {inProgressList.map((item) => (
                            <CrewEntry key={item.id} entry={item} />
                        ))}
                    </ListGroup>

                    <CrewDivider text="Needs Nudge" />
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

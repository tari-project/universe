import CrewDivider from './CrewDivider/CrewDivider';
import CrewEntry from './CrewEntry/CrewEntry';
import { Inside, ListGroup, Wrapper } from './styles';
import { crewList } from '../data';

export default function CrewList() {
    const completedList = crewList.filter((item) => item.status === 'completed');
    const inProgressList = crewList.filter((item) => item.status === 'in_progress');
    const needsNudgeList = crewList.filter((item) => item.status === 'needs_nudge');

    return (
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
    );
}

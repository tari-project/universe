import CrewDivider from './CrewDivider/CrewDivider';
import CrewEntry from './CrewEntry/CrewEntry';
import { Inside, ListGroup, OuterWrapper, Wrapper } from './styles';
import { crewList } from '../data';
import { useTranslation } from 'react-i18next';

export default function CrewList() {
    const { t } = useTranslation();
    const completedList = crewList.filter((item) => item.status === 'completed');
    const inProgressList = crewList.filter((item) => item.status === 'in_progress');
    const needsNudgeList = crewList.filter((item) => item.status === 'needs_nudge');

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

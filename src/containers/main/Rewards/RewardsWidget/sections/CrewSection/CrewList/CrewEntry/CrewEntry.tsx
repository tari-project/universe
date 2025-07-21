import { type CrewEntry } from '../../data';
import { ContentWrapper, Wrapper, TopRow, Progress, ProgressPercent, ProgressBar } from './styles';
import CrewAvatar from './CrewAvatar/CrewAvatar';

import personImage from '../../../../../images/person1.png';

interface Props {
    entry: CrewEntry;
}

export default function CrewEntry({ entry }: Props) {
    const { handle, reward, progress } = entry;

    return (
        <Wrapper>
            <CrewAvatar image={personImage} status="online" />
            <ContentWrapper>
                <TopRow>
                    <div>{handle}</div>
                    <div>{reward?.amount}</div>
                </TopRow>
                <Progress>
                    <ProgressPercent>{progress}%</ProgressPercent>
                    <ProgressBar />
                </Progress>
            </ContentWrapper>
        </Wrapper>
    );
}

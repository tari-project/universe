import { type CrewEntry } from '../../data';
import { ContentWrapper, Wrapper, TopRow, Username } from './styles';
import CrewAvatar from './CrewAvatar/CrewAvatar';

import personImage from '../../../../../images/person1.png';
import CrewProgressBar from './CrewProgressBar/CrewProgressBar';

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
                    <Username>{handle}</Username>
                </TopRow>
                <CrewProgressBar progress={progress} />
            </ContentWrapper>
        </Wrapper>
    );
}

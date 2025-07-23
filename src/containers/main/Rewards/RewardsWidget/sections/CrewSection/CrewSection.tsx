import StreakProgress from '../StreakProgress/StreakProgress';
import CrewList from './CrewList/CrewList';
import Filters from './Filters/Filters';
import { IntroTextWrapper, Text, Title, Wrapper } from './styles';

export default function CrewSection() {
    return (
        <Wrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <StreakProgress isInline={true} />

            <IntroTextWrapper>
                <Title>{`My Crew`}</Title>
                <Text>
                    {`Earn `}
                    <strong>{`100 XTM`}</strong>
                    {` for every `}
                    <strong>{`7 days`}</strong>
                    {` your friend mines. Your friend will also earn `}
                    <strong>{`50 XTM`}</strong>
                    {`.`}
                </Text>
            </IntroTextWrapper>

            <Filters />

            <CrewList />
        </Wrapper>
    );
}

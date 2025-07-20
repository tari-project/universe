import { Wrapper, Text, StreakText } from './styles';

export default function StreakMessage() {
    return (
        <Wrapper>
            <Text>{`Keep your streak to keep earning rewards!`}</Text>
            <StreakText>{`7 Day Streak 🔥`}</StreakText>
        </Wrapper>
    );
}

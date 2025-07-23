import { useRewardsStore } from '@app/store/useRewardsStore';
import { Wrapper, Text, StreakText } from './styles';

export default function StreakProgress() {
    const { isOpen } = useRewardsStore();

    return (
        <Wrapper $isOpen={isOpen}>
            <Text>{`Keep your streak to keep earning rewards!`}</Text>
            <StreakText>{`7 Day Streak 🔥`}</StreakText>
        </Wrapper>
    );
}

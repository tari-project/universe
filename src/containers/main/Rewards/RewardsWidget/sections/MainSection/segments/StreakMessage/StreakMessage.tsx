import { useReferrerProgress } from '@app/hooks/crew/useReferrerProgress';
import { Wrapper, Text, StreakText } from './styles';

export default function StreakMessage() {
    const { referrerProgress, isLoading } = useReferrerProgress();

    if (isLoading) {
        return (
            <Wrapper>
                <Text>Loading streak...</Text>
                <StreakText>🔥</StreakText>
            </Wrapper>
        );
    }

    // Default values if no referrer progress data
    const currentStreak = referrerProgress?.currentStreak || 0;
    const meetsMinimumDays = referrerProgress?.meetsMinimumDays || false;

    // Determine streak display
    const getStreakDisplay = () => {
        if (currentStreak === 0) {
            return 'Start Your Streak! 🚀';
        }

        if (currentStreak === 1) {
            return '1 Day Streak 🔥';
        }

        return `${currentStreak} Day Streak 🔥`;
    };

    // Determine message based on progress
    const getMessage = () => {
        if (!referrerProgress) {
            return 'Keep your streak to keep earning rewards!';
        }

        if (currentStreak === 0) {
            return 'Start mining to begin your streak and earn rewards!';
        }

        if (meetsMinimumDays) {
            return "Great job! You've met the minimum requirements. Keep going!";
        }

        const daysNeeded = referrerProgress.minReferrerDaysRequired - currentStreak;
        if (daysNeeded > 0) {
            return `${daysNeeded} more days to meet minimum requirements!`;
        }

        return 'Keep your streak to keep earning rewards!';
    };

    return (
        <Wrapper>
            <Text>{getMessage()}</Text>
            <StreakText>{getStreakDisplay()}</StreakText>
        </Wrapper>
    );
}

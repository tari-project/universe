import { useReferrerProgress } from '@app/hooks/crew/useReferrerProgress';
import InfoTooltip from '../../components/InfoTooltip/InfoTooltip';
import DaysProgress from './DaysProgress/DaysProgress';
import { Wrapper, Text, StreakText, StreakMessage, UnlockMessage } from './styles';
import { useTranslation, Trans } from 'react-i18next';

interface Props {
    isInline?: boolean;
}

const STREAK_DAYS_REQUIRED = 3;

export default function StreakProgress({ isInline = false }: Props) {
    const { t } = useTranslation();

    // Get data directly from React Query
    const { referrerProgress, isLoading } = useReferrerProgress();

    const currentStreak = referrerProgress?.currentStreak || 0;
    const meetsMinimumDays = referrerProgress?.meetsMinimumDays || false;
    const minReferrerDaysRequired = referrerProgress?.minReferrerDaysRequired ?? STREAK_DAYS_REQUIRED;

    if (isLoading) {
        return (
            <Wrapper $isInline={isInline}>
                <StreakMessage $isInline={isInline}>
                    <Text>Loading streak...</Text>
                    <StreakText>🔥</StreakText>
                </StreakMessage>
            </Wrapper>
        );
    }

    const isStreakActive = currentStreak >= STREAK_DAYS_REQUIRED;

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
            return t('airdrop:crewRewards.streak.keepStreak');
        }

        if (currentStreak === 0) {
            return 'Start mining to begin your streak and earn rewards!';
        }

        if (meetsMinimumDays) {
            return "Great job! You've met the minimum requirements. Keep going!";
        }

        const daysNeeded = minReferrerDaysRequired - currentStreak;
        if (daysNeeded > 0) {
            return `${daysNeeded} more days to meet minimum requirements!`;
        }

        return t('airdrop:crewRewards.streak.keepStreak');
    };

    return (
        <Wrapper $isInline={isInline}>
            {!isStreakActive ? (
                <UnlockMessage $isInline={isInline}>
                    <Text>
                        {getMessage()}{' '}
                        <InfoTooltip>
                            <Trans
                                i18nKey="airdrop:crewRewards.streak.mineConsecutiveDays"
                                values={{
                                    streakDaysRequired: minReferrerDaysRequired,
                                }}
                            />
                        </InfoTooltip>
                    </Text>
                    <DaysProgress current={currentStreak} total={minReferrerDaysRequired} />
                </UnlockMessage>
            ) : (
                <StreakMessage $isInline={isInline}>
                    <Text>{getMessage()}</Text>
                    <StreakText>{getStreakDisplay()}</StreakText>
                </StreakMessage>
            )}
        </Wrapper>
    );
}

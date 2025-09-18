import InfoTooltip from '../../components/InfoTooltip/InfoTooltip';
import DaysProgress from './DaysProgress/DaysProgress';
import { Wrapper, Text, StreakText, StreakMessage, UnlockMessage, LoadingMessage } from './styles';
import { useTranslation, Trans } from 'react-i18next';
import { useReferrerProgress } from '@app/hooks/crew/useReferrerProgress';

interface Props {
    isInline?: boolean;
}

const STREAK_DAYS_REQUIRED = 3;

export default function StreakProgress({ isInline = false }: Props) {
    const { t } = useTranslation();

    const { data, isLoading } = useReferrerProgress();
    const referrerProgress = data?.referrerProgress;
    const totalDaysRequired = data?.referrerProgress?.minReferrerDaysRequired ?? 0;

    const currentStreak = referrerProgress?.currentStreak || 0;
    const meetsMinimumDays = referrerProgress?.meetsMinimumDays || false;
    const minReferrerDaysRequired = referrerProgress?.minReferrerDaysRequired ?? STREAK_DAYS_REQUIRED;

    if (isLoading) {
        return (
            <Wrapper $isInline={isInline}>
                <LoadingMessage $isInline={isInline}>
                    <Text></Text>
                </LoadingMessage>
            </Wrapper>
        );
    }

    // Hide component if totalDaysRequired is 0
    if (totalDaysRequired === 0) {
        return null;
    }

    const isStreakActive = currentStreak >= STREAK_DAYS_REQUIRED;

    // Determine streak display
    const getStreakDisplay = () => {
        if (currentStreak === 0) {
            return t('airdrop:crewRewards.streak.startYourStreak');
        }

        if (currentStreak === 1) {
            return t('airdrop:crewRewards.streak.oneDayStreak');
        }

        return t('airdrop:crewRewards.streak.multiDayStreak', { days: currentStreak });
    };

    // Determine message based on progress
    const getMessage = () => {
        if (!referrerProgress) {
            return t('airdrop:crewRewards.streak.keepStreak');
        }

        if (currentStreak === 0) {
            return t('airdrop:crewRewards.streak.startMiningMessage');
        }

        if (meetsMinimumDays) {
            return t('airdrop:crewRewards.streak.minimumRequirementsMet');
        }

        const daysNeeded = minReferrerDaysRequired - currentStreak;
        if (daysNeeded > 0) {
            return t('airdrop:crewRewards.streak.daysToMinimum', { days: daysNeeded });
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

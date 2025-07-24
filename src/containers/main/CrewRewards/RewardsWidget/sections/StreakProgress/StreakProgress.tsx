import { useCrewRewardsStore } from '@app/store/useCrewRewardsStore';
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
    const streakDays = useCrewRewardsStore((s) => s.streakDays);

    const isStreakActive = streakDays >= STREAK_DAYS_REQUIRED;

    return (
        <Wrapper $isInline={isInline}>
            {!isStreakActive ? (
                <UnlockMessage $isInline={isInline}>
                    <Text>
                        {t('airdrop:crewRewards.streak.unlockBonusRewards')}{' '}
                        <InfoTooltip>
                            <Trans
                                i18nKey="airdrop:crewRewards.streak.mineConsecutiveDays"
                                values={{
                                    streakDaysRequired: 3,
                                }}
                            />
                        </InfoTooltip>
                    </Text>
                    <DaysProgress current={streakDays} total={STREAK_DAYS_REQUIRED} />
                </UnlockMessage>
            ) : (
                <StreakMessage $isInline={isInline}>
                    <Text>{t('airdrop:crewRewards.streak.keepStreak')}</Text>
                    <StreakText>{t('airdrop:crewRewards.streak.dayStreak', { days: streakDays })}</StreakText>
                </StreakMessage>
            )}
        </Wrapper>
    );
}

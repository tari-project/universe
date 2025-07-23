import { useCrewRewardsStore } from '@app/store/useCrewRewardsStore';
import InfoTooltip from '../../components/InfoTooltip/InfoTooltip';
import DaysProgress from './DaysProgress/DaysProgress';
import { Wrapper, Text, StreakText, StreakMessage, UnlockMessage } from './styles';

interface Props {
    isInline?: boolean;
}

const STREAK_DAYS_REQUIRED = 3;

export default function StreakProgress({ isInline = false }: Props) {
    const streakDays = useCrewRewardsStore((s) => s.streakDays);

    const isStreakActive = streakDays >= STREAK_DAYS_REQUIRED;

    return (
        <Wrapper $isInline={isInline}>
            {!isStreakActive ? (
                <UnlockMessage $isInline={isInline}>
                    <Text>
                        {`Unlock your bonus rewards`}{' '}
                        <InfoTooltip>
                            {`Mine for at least`} <strong>{`3 consecutive days`}</strong>{' '}
                            {`each week to earn your bonus XTM.`}
                        </InfoTooltip>
                    </Text>
                    <DaysProgress current={streakDays} total={STREAK_DAYS_REQUIRED} />
                </UnlockMessage>
            ) : (
                <StreakMessage $isInline={isInline}>
                    <Text>{`Keep your streak to keep earning rewards!`}</Text>
                    <StreakText>{`${streakDays} Day Streak 🔥`}</StreakText>
                </StreakMessage>
            )}
        </Wrapper>
    );
}

import InfoTooltip from '../../components/InfoTooltip/InfoTooltip';
import DaysProgress from './DaysProgress/DaysProgress';
import { Wrapper, Text, StreakText, StreakMessage, UnlockMessage } from './styles';

interface Props {
    isInline?: boolean;
}

export default function StreakProgress({ isInline = false }: Props) {
    const isStreakActive = false;

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
                    <DaysProgress current={1} total={3} />
                </UnlockMessage>
            ) : (
                <StreakMessage $isInline={isInline}>
                    <Text>{`Keep your streak to keep earning rewards!`}</Text>
                    <StreakText>{`7 Day Streak 🔥`}</StreakText>
                </StreakMessage>
            )}
        </Wrapper>
    );
}

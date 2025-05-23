import { MiningTimeVariant, MiniWrapper, TimerDot, Wrapper } from './styles.ts';
import { useMiningTime } from '@app/hooks/mining/useMiningTime.ts';

interface MiningTimeProps {
    variant?: MiningTimeVariant;
}
export const MiningTime = ({ variant = 'primary' }: MiningTimeProps) => {
    const { daysString, hoursString, minutes, seconds } = useMiningTime();

    const formated = `${daysString} ${hoursString} ${minutes}:${seconds}`;

    const markup = <div>{formated}</div>;
    if (variant === 'mini') {
        return (
            <MiniWrapper>
                <TimerDot />
                {markup}
            </MiniWrapper>
        );
    }

    return (
        <Wrapper>
            <TimerDot />
            {markup}
        </Wrapper>
    );
};

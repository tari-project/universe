import { MiningTimeVariant, MiniWrapper, TimerDot, TimerTextWrapper, SpacedNum, Wrapper } from './styles.ts';
import { useMiningTime } from '@app/hooks/mining/useMiningTime.ts';

interface MiningTimeProps {
    variant?: MiningTimeVariant;
}
export const MiningTime = ({ variant = 'primary' }: MiningTimeProps) => {
    const { daysString, hoursString, minutes, seconds } = useMiningTime();
    const renderHours = hoursString && parseInt(hoursString) > 0;
    const daysMarkup = daysString?.length ? daysString : null;
    const hourMarkup = renderHours ? (
        <>{hoursString?.split('').map((c, i) => <SpacedNum key={`hr-${i}-${c}`}>{c}</SpacedNum>)}:</>
    ) : null;

    // TODO: dedup from block time/make reusable spaced counter?
    const markup = (
        <TimerTextWrapper>
            {daysMarkup}
            {hourMarkup}
            {minutes?.split('').map((c, i) => <SpacedNum key={`min-${i}-${c}`}>{c}</SpacedNum>)}:
            {seconds?.split('').map((c, i) => <SpacedNum key={`sec-${i}-${c}`}>{c}</SpacedNum>)}
        </TimerTextWrapper>
    );
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

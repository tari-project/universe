import { TimeSince } from '@app/utils';
import {
    MiningTimeVariant,
    MiniWrapper,
    TimerDot,
    TimerTextWrapper,
    SpacedNum,
    Wrapper,
    Heading,
    HeadingSection,
    TimerUnitWrapper,
} from './styles.ts';

interface MiningTimeProps {
    variant?: MiningTimeVariant;
    timing: Partial<TimeSince>;
}
export const MiningTime = ({ variant = 'primary', timing }: MiningTimeProps) => {
    const isMini = variant === 'mini';
    const { daysString, hoursString, minutes, seconds } = timing;

    const renderHours = hoursString && parseInt(hoursString) > 0;
    const daysMarkup = daysString?.length ? daysString : null;

    const hourMarkup = renderHours ? (
        <>
            {hoursString?.split('').map((c, i) => <SpacedNum key={`hr-${i}-${c}`}>{c}</SpacedNum>)}
            <TimerUnitWrapper $variant={variant}>{isMini ? ':' : `h`}</TimerUnitWrapper>
        </>
    ) : null;

    // TODO: dedup from block time/make reusable spaced counter?
    const markup = (
        <TimerTextWrapper $variant={variant}>
            {daysMarkup}
            {hourMarkup}
            {minutes?.split('').map((c, i) => <SpacedNum key={`min-${i}-${c}`}>{c}</SpacedNum>)}
            <TimerUnitWrapper $variant={variant}>{isMini ? ':' : `m`}</TimerUnitWrapper>
            {seconds?.split('').map((c, i) => <SpacedNum key={`sec-${i}-${c}`}>{c}</SpacedNum>)}
            {!isMini && 's'}
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
            <HeadingSection>
                <Heading>{`Time mining`}</Heading>
                <TimerDot />
            </HeadingSection>
            {markup}
        </Wrapper>
    );
};

import { MiningTimeVariant, MiniWrapper, TimerDot, Wrapper } from './styles.ts';
import { useMiningStore } from '@app/store';

interface MiningTimeProps {
    variant?: MiningTimeVariant;
}
export const MiningTime = ({ variant = 'primary' }: MiningTimeProps) => {
    const miningTime = useMiningStore((s) => s.miningTime);

    const markup = <div>{`tiiimee`}</div>;
    if (variant === 'mini') {
        return (
            <MiniWrapper>
                <TimerDot />
                {markup}
                {miningTime}
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

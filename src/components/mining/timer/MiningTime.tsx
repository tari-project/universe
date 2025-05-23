import { MiningTimeVariant, MiniWrapper, TimerDot, Wrapper } from './styles.ts';
import { useMiningStore } from '@app/store';

interface MiningTimeProps {
    variant?: MiningTimeVariant;
}
export const MiningTime = ({ variant = 'primary' }: MiningTimeProps) => {
    const miningTime = useMiningStore((s) => s.miningTime);

    const date = new Date(miningTime || 0);
    const formated = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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

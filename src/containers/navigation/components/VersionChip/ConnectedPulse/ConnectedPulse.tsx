import { Dot, Pulse, Wrapper } from './styles';
import { useMiningMetricsStore } from '@app/store';

export default function ConnectedPulse({ size = 5 }: { size?: number }) {
    const isConnectedToTariNetwork = useMiningMetricsStore((s) => s.isNodeConnected);
    return (
        <Wrapper $size={size}>
            <Dot $isConnected={isConnectedToTariNetwork} $size={size} />
            <Pulse $isConnected={isConnectedToTariNetwork} />
        </Wrapper>
    );
}

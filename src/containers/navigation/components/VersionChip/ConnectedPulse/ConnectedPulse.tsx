import { Dot, Pulse, Wrapper } from './styles';
import { useMiningMetricsStore } from '@app/store';

export default function ConnectedPulse() {
    const isConnectedToTariNetwork = useMiningMetricsStore((s) => s.isNodeConnected);
    return (
        <Wrapper>
            <Dot $isConnected={isConnectedToTariNetwork} />
            <Pulse $isConnected={isConnectedToTariNetwork} />
        </Wrapper>
    );
}

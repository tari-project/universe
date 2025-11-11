import { Dot, Pulse, Wrapper } from './styles';
import { useNodeStore } from '@app/store';

export default function ConnectedPulse({ size = 5 }: { size?: number }) {
    const isConnectedToTariNetwork = useNodeStore((s) => s.isNodeConnected);
    return (
        <Wrapper $size={size}>
            <Dot $isConnected={isConnectedToTariNetwork} $size={size} />
            <Pulse $isConnected={isConnectedToTariNetwork} />
        </Wrapper>
    );
}

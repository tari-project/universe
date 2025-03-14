import { Dot, Pulse, Wrapper } from './styles';

interface Props {
    isConnected: boolean;
}

export default function ConnectedPulse({ isConnected }: Props) {
    return (
        <Wrapper>
            <Dot $isConnected={isConnected} />
            <Pulse $isConnected={isConnected} />
        </Wrapper>
    );
}

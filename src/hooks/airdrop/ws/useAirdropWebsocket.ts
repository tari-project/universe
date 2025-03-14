import useSocketEvents from './useSocket.ts';
import { useEmitMiningStatus } from './useHandleEmitMiningStatus.ts';

export default function useAirdropWebsocket() {
    useSocketEvents();
    useEmitMiningStatus();
}

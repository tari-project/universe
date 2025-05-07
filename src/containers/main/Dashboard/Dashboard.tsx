import { useMiningStatesSync } from '@app/hooks';
import MiningView from './MiningView/MiningView';
import DisconnectWrapper from '../Reconnect/DisconnectWrapper.tsx';
import { DashboardContentContainer } from './styles';
import { useAirdropStore, useUIStore } from '@app/store';

export default function Dashboard() {
    const connectionStatus = useUIStore((s) => s.connectionStatus);
    const orphanChainUiDisabled = useAirdropStore((s) => s.orphanChainUiDisabled);
    useMiningStatesSync();

    return (
        <DashboardContentContainer>
            {connectionStatus !== 'connected' && !orphanChainUiDisabled ? <DisconnectWrapper /> : null}
            <MiningView />
        </DashboardContentContainer>
    );
}

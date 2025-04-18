import { useMiningStatesSync } from '@app/hooks';
import MiningView from './MiningView/MiningView';
import DisconnectWrapper from '../Reconnect/DisconnectWrapper.tsx';
import { DashboardContentContainer } from './styles';
import { useUIStore } from '@app/store';

export default function Dashboard() {
    const connectionStatus = useUIStore((s) => s.connectionStatus);
    useMiningStatesSync();

    return (
        <DashboardContentContainer>
            {connectionStatus !== 'connected' ? <DisconnectWrapper /> : null}
            <MiningView />
        </DashboardContentContainer>
    );
}

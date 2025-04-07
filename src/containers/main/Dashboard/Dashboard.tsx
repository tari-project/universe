import Disconnected from '../Reconnect/Disconnected';
import DisconnectedSevere from '../Reconnect/DisconnectedSevere';
import MiningView from './MiningView/MiningView';
import { DashboardContentContainer } from './styles';
import { useUIStore } from '@app/store';

export default function Dashboard() {
    const connectionStatus = useUIStore((s) => s.connectionStatus);
    return (
        <DashboardContentContainer>
            {connectionStatus === 'disconnected' && <Disconnected />}
            {connectionStatus === 'disconnected-severe' && <DisconnectedSevere />}
            <MiningView />
        </DashboardContentContainer>
    );
}

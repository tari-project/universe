import Disconnected from '../Reconnect/Disconnected';
import DisconnectedSevere from '../Reconnect/DisconnectedSevere';
import MiningView from './MiningView/MiningView';
import { DashboardContentContainer } from './styles';

export default function Dashboard() {
    return (
        <DashboardContentContainer>
            <Disconnected />
            <DisconnectedSevere />
            <MiningView />
        </DashboardContentContainer>
    );
}

import Disconnected from '../Reconnect/Disconnected';
import MiningView from './MiningView/MiningView';
import { DashboardContentContainer } from './styles';

export default function Dashboard() {
    return (
        <DashboardContentContainer>
            <Disconnected />
            <MiningView />
        </DashboardContentContainer>
    );
}

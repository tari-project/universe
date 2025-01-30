import MiningView from './MiningView/MiningView';
import { DashboardContentContainer } from './styles';

export default function Dashboard() {
    return (
        <DashboardContentContainer>
            <MiningView />
        </DashboardContentContainer>
    );
}

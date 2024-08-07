import { DashboardContainer } from './styles';
import MiningView from './MiningView/MiningView';
import TribesView from './TribesView/TribesView';
import { viewType } from '../../store/types';
import SetupViewContainer from './SetupView/SetupViewContainer';

function Dashboard({ status }: { status: viewType }) {
    let view = <MiningView />;

    switch (status) {
        case 'setup':
            view = <SetupViewContainer />;
            break;
        case 'tribes':
            view = <TribesView />;
            break;
        default:
            view = <MiningView />;
    }

    return <DashboardContainer>{view}</DashboardContainer>;
}

export default Dashboard;

import { DashboardContainer } from './styles';
import MiningView from './MiningView/MiningView';
import SetupView from './SetupView/SetupView';
import TribesView from './TribesView/TribesView';
import { viewType } from '../../store/types';

function Dashboard({ status }: { status: viewType }) {
  let view = <MiningView />;

  switch (status) {
    case 'setup':
      view = <SetupView />;
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

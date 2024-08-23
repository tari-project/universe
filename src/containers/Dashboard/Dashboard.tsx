import { DashboardContainer, SetupGradient } from './styles';
import MiningView from './MiningView/MiningView';
import TribesView from './TribesView/TribesView';
import { viewType } from '../../store/types';
import SetupViewContainer from './SetupView/SetupViewContainer';

function Dashboard({ status }: { status: viewType }) {
    const viewMarkup =
        status == 'setup' ? <SetupViewContainer /> : status == 'tribes' ? <TribesView /> : <MiningView />;

    return (
        <DashboardContainer>
            {status == 'setup' ? <SetupGradient /> : null}
            {viewMarkup}
        </DashboardContainer>
    );
}

export default Dashboard;

import { viewType } from '../../store/types';
import MiningView from './MiningView/MiningView';
import TribesView from './TribesView/TribesView';
import SetupViewContainer from './SetupView/SetupViewContainer';
import { DashboardContentContainer } from './styles';

export default function Dashboard({ status }: { status: viewType }) {
    const viewMarkup =
        status == 'setup' ? <SetupViewContainer /> : status == 'tribes' ? <TribesView /> : <MiningView />;
    return <DashboardContentContainer layout>{viewMarkup}</DashboardContentContainer>;
}

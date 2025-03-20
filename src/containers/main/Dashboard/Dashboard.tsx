import { useMiningStatesSync } from '@app/hooks';
import MiningView from './MiningView/MiningView';
import { DashboardContentContainer } from './styles';

export default function Dashboard() {
    useMiningStatesSync();

    return (
        <DashboardContentContainer>
            <MiningView />
        </DashboardContentContainer>
    );
}

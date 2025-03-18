import { DashboardContentContainer, VersionWrapper } from './styles';
import MiningView from './MiningView/MiningView';
import { useMiningStatesSync } from '@app/hooks';
import VersionChip from '@app/containers/navigation/components/VersionChip/VersionChip.tsx';

export default function Dashboard() {
    useMiningStatesSync();

    return (
        <DashboardContentContainer>
            <VersionWrapper>
                <VersionChip />
            </VersionWrapper>
            <MiningView />
        </DashboardContentContainer>
    );
}

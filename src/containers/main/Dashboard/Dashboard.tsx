import { useAppConfigStore } from '@app/store/useAppConfigStore';
import MiningView from './MiningView/MiningView';
import { DashboardContentContainer } from './styles';
import { useTappletsStore } from '@app/store/useTappletsStore';
import ActiveDevTapplet from '@app/components/ootle/ActiveDevTapplet';

export default function Dashboard() {
    const ootleMode = useAppConfigStore((s) => s.ootle_enabled);
    const activeTapplet = useTappletsStore((s) => s.activeTappletId);

    return (
        <DashboardContentContainer layout $ootleModeOn={ootleMode}>
            {ootleMode && activeTapplet ? <ActiveDevTapplet /> : <MiningView />}
        </DashboardContentContainer>
    );
}

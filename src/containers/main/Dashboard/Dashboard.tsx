import { useAppConfigStore } from '@app/store/useAppConfigStore';
import MiningView from './MiningView/MiningView';
import { DashboardContentContainer } from './styles';
import { useTappletsStore } from '@app/store/useTappletsStore';
import ActiveTappletView from '@app/components/ootle/ActiveTappletView';

export default function Dashboard() {
    const ootleMode = useAppConfigStore((s) => s.ootle_enabled);
    const activeTapplet = useTappletsStore((s) => s.activeTapplet);

    return (
        <DashboardContentContainer>
            {ootleMode && activeTapplet ? <ActiveTappletView /> : <MiningView />}
        </DashboardContentContainer>
    );
}

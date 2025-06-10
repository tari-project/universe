import { useMiningStatesSync } from '@app/hooks';
import DisconnectWrapper from '../Reconnect/DisconnectWrapper.tsx';
import { DashboardContentContainer } from './styles';
import { useAirdropStore, useUIStore } from '@app/store';
import { useTappletsStore } from '@app/store/useTappletsStore';
import { Tapplet } from '@app/components/tapplets/Tapplet.tsx';
import MiningView from './MiningView/MiningView.tsx';

export default function Dashboard() {
    const { uiBridgeSwapsEnabled } = useTappletsStore();
    const activeTapplet = useTappletsStore((s) => s.activeTapplet);
    const showTapplet = useUIStore((s) => s.showTapplet);
    const connectionStatus = useUIStore((s) => s.connectionStatus);
    const orphanChainUiDisabled = useAirdropStore((s) => s.orphanChainUiDisabled);

    useMiningStatesSync();

    return (
        <DashboardContentContainer $tapplet={!!activeTapplet}>
            {connectionStatus !== 'connected' && !orphanChainUiDisabled ? <DisconnectWrapper /> : null}
            {uiBridgeSwapsEnabled && showTapplet && activeTapplet ? (
                <Tapplet source={activeTapplet.source} />
            ) : (
                <MiningView />
            )}
        </DashboardContentContainer>
    );
}

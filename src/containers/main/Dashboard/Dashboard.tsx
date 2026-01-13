import { useMiningStatesSync } from '@app/hooks/mining/useMiningStatesSync.ts';
import DisconnectWrapper from '../Reconnect/DisconnectWrapper.tsx';
import { DashboardContentContainer } from './styles';
import { useAirdropStore, useUIStore } from '@app/store';
import { useTappletsStore } from '@app/store/useTappletsStore';
import { Tapplet } from '@app/components/tapplets/Tapplet.tsx';
import MiningView from './MiningView/MiningView.tsx';
import { FEATURE_FLAGS } from '@app/store/consts.ts';

export default function Dashboard() {
    useMiningStatesSync();

    const showTapplet = useUIStore((s) => s.showTapplet);
    const activeTapplet = useTappletsStore((s) => s.activeTapplet);
    const connectionStatus = useUIStore((s) => s.connectionStatus);
    const orphanChainUiDisabled = useAirdropStore((s) =>
        s.features?.includes(FEATURE_FLAGS.FF_UI_ORPHAN_CHAIN_DISABLED)
    );

    const renderTapplet = showTapplet && activeTapplet && activeTapplet?.source?.length > 0;

    return (
        <DashboardContentContainer $tapplet={renderTapplet}>
            {connectionStatus !== 'connected' && !orphanChainUiDisabled ? <DisconnectWrapper /> : null}
            {renderTapplet ? <Tapplet source={activeTapplet.source} /> : <MiningView />}
        </DashboardContentContainer>
    );
}

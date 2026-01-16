import { useMiningStatesSync } from '@app/hooks/mining/useMiningStatesSync.ts';
import DisconnectWrapper from '../Reconnect/DisconnectWrapper.tsx';
import { DashboardContentContainer } from './styles';
import { useAirdropStore, useUIStore } from '@app/store';
import { useTappletsStore } from '@app/store/useTappletsStore';
import { Tapplet } from '@app/components/tapplets/Tapplet.tsx';
import MiningView from './MiningView/MiningView.tsx';
import { FEATURE_FLAGS } from '@app/store/consts.ts';
import { Activity } from 'react';

export default function Dashboard() {
    useMiningStatesSync();

    const showTapplet = useUIStore((s) => s.showTapplet);
    const activeTapplet = useTappletsStore((s) => s.activeTapplet);

    const connectionStatus = useUIStore((s) => s.connectionStatus);
    const features = useAirdropStore((s) => s.features);
    const orphanChainUiDisabled = !!features?.includes(FEATURE_FLAGS.FF_UI_ORPHAN_CHAIN_DISABLED);

    const renderTapplet = showTapplet && activeTapplet && activeTapplet?.source?.length > 0;

    const tappletMarkup = (
        <Activity mode={showTapplet ? 'visible' : 'hidden'} key="tapplet">
            {renderTapplet ? <Tapplet source={activeTapplet.source} /> : null}
        </Activity>
    );
    const mainMarkup = (
        <Activity mode={!showTapplet ? 'visible' : 'hidden'} key="main">
            <MiningView />
        </Activity>
    );
    return (
        <DashboardContentContainer $tapplet={renderTapplet}>
            {connectionStatus !== 'connected' && !orphanChainUiDisabled ? <DisconnectWrapper /> : null}
            {mainMarkup}
            {tappletMarkup}
        </DashboardContentContainer>
    );
}

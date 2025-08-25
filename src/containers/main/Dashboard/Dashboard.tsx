import { useMiningStatesSync } from '@app/hooks/mining/useMiningStatesSync.ts';
import DisconnectWrapper from '../Reconnect/DisconnectWrapper.tsx';
import { DashboardContentContainer } from './styles';
import { useAirdropStore, useUIStore } from '@app/store';
import { useTappletsStore } from '@app/store/useTappletsStore';
import { Tapplet } from '@app/components/tapplets/Tapplet.tsx';
import MiningView from './MiningView/MiningView.tsx';
import { FEATURE_FLAGS } from '@app/store/consts.ts';
import { useRef } from 'react';

export default function Dashboard() {
    const iframeRefs = useRef<Record<number, HTMLIFrameElement | null>>({});
    const activeTapplet = useTappletsStore((s) => s.activeTapplet);
    const runningTapplets = useTappletsStore((s) => s.runningTapplets);
    const showTapplet = useUIStore((s) => s.showTapplet);
    const connectionStatus = useUIStore((s) => s.connectionStatus);
    const orphanChainUiDisabled = useAirdropStore((s) =>
        s.features?.includes(FEATURE_FLAGS.FF_UI_ORPHAN_CHAIN_DISABLED)
    );
    console.info('DASHBOARD', activeTapplet?.tapplet_id, runningTapplets);
    useMiningStatesSync();

    return (
        <DashboardContentContainer $tapplet={showTapplet}>
            {connectionStatus !== 'connected' && !orphanChainUiDisabled ? <DisconnectWrapper /> : null}
            {showTapplet && runningTapplets.length > 0 ? (
                <>
                    {runningTapplets.map(({ tapplet_id, source }) => (
                        <Tapplet
                            key={tapplet_id}
                            tappletId={tapplet_id}
                            source={source}
                            ref={(el) => {
                                if (el) iframeRefs.current[tapplet_id] = el;
                                else delete iframeRefs.current[tapplet_id];
                            }}
                        />
                    ))}
                </>
            ) : (
                <MiningView />
            )}
        </DashboardContentContainer>
    );
}

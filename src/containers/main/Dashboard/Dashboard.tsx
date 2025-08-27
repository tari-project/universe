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
    const runningTapplets = useTappletsStore((s) => s.runningTapplets);
    const showTapplet = useUIStore((s) => s.showTapplet);
    const connectionStatus = useUIStore((s) => s.connectionStatus);
    const orphanChainUiDisabled = useAirdropStore((s) =>
        s.features?.includes(FEATURE_FLAGS.FF_UI_ORPHAN_CHAIN_DISABLED)
    );
    useMiningStatesSync();

    return (
        <DashboardContentContainer $tapplet={showTapplet}>
            {connectionStatus !== 'connected' && !orphanChainUiDisabled ? <DisconnectWrapper /> : null}
            {showTapplet && runningTapplets.length > 0 ? (
                <>
                    {runningTapplets.map((t) => (
                        <Tapplet
                            key={t.tapplet_id}
                            iframeRefs={iframeRefs}
                            tapplet={t}
                            ref={(el) => {
                                if (el) iframeRefs.current[t.tapplet_id] = el;
                                else delete iframeRefs.current[t.tapplet_id];
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

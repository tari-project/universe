import { useMiningStatesSync } from '@app/hooks/mining/useMiningStatesSync.ts';
import DisconnectWrapper from '../Reconnect/DisconnectWrapper.tsx';
import { DashboardContentContainer } from './styles';
import { useAirdropStore, useUIStore, useWalletStore } from '@app/store';
import { useTappletsStore } from '@app/store/useTappletsStore';
import { Tapplet } from '@app/components/tapplets/Tapplet.tsx';
import SwapUI from '@app/components/wallet/sidebarWallet/swap.tsx';
import MiningView from './MiningView/MiningView.tsx';
import { FEATURE_FLAGS } from '@app/store/consts.ts';
import { Activity } from 'react';

export default function Dashboard() {
    useMiningStatesSync();

    const showTapplet = useUIStore((s) => s.showTapplet);
    const isSwapping = Boolean(useWalletStore((s) => s.is_swapping));
    const activeTapplet = useTappletsStore((s) => s.activeTapplet);

    const connectionStatus = useUIStore((s) => s.connectionStatus);
    const features = useAirdropStore((s) => s.features);
    const orphanChainUiDisabled = !!features?.includes(FEATURE_FLAGS.FF_UI_ORPHAN_CHAIN_DISABLED);

    const renderTapplet = Boolean(showTapplet && activeTapplet && activeTapplet?.source?.length > 0);

    const tappletMarkup = (
        <Activity mode={showTapplet ? 'visible' : 'hidden'} key="tapplet">
            {renderTapplet && activeTapplet ? <Tapplet source={activeTapplet.source} /> : null}
        </Activity>
    );
    const buyMarkup = (
        <Activity mode={isSwapping ? 'visible' : 'hidden'} key="buy">
            {isSwapping ? <SwapUI /> : null}
        </Activity>
    );
    const mainMarkup = (
        <Activity mode={!showTapplet && !isSwapping ? 'visible' : 'hidden'} key="main">
            <MiningView />
        </Activity>
    );
    return (
        <DashboardContentContainer $tapplet={renderTapplet || isSwapping}>
            {connectionStatus !== 'connected' && !orphanChainUiDisabled ? <DisconnectWrapper /> : null}
            {mainMarkup}
            {tappletMarkup}
            {buyMarkup}
        </DashboardContentContainer>
    );
}

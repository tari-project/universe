import { create } from 'zustand';
import { ActiveTapplet, BridgeTxDetails } from '@app/types/tapplets/tapplet.types.ts';
import { initTappletSigner, useTappletSignerStore } from './useTappletSignerStore.ts';
import { invoke } from '@tauri-apps/api/core';

interface TappletsStoreState {
    isInitialized: boolean;
    isFetching: boolean;
    activeTapplet: ActiveTapplet | undefined;
    ongoingBridgeTx: BridgeTxDetails | undefined;
    isPendingTappletTx: boolean;
}

const initialState: TappletsStoreState = {
    isFetching: false,
    isInitialized: false,
    activeTapplet: undefined,
    ongoingBridgeTx: undefined,
    isPendingTappletTx: false,
};

export const useTappletsStore = create<TappletsStoreState>()(() => ({ ...initialState }));

export const deactivateTapplet = () => useTappletsStore.setState({ activeTapplet: undefined });
export const setOngoingBridgeTx = (tx: BridgeTxDetails) =>
    useTappletsStore.setState({
        ongoingBridgeTx: tx,
        isPendingTappletTx: true,
    });

export const removeOngoingBridgeTx = () =>
    useTappletsStore.setState({
        ongoingBridgeTx: undefined,
        isPendingTappletTx: false,
    });

export const setActiveTappById = async (tappletId: number, isBuiltIn = false) => {
    if (tappletId == useTappletsStore.getState().activeTapplet?.tapplet_id) return;
    const tappProviderState = useTappletSignerStore.getState();
    if (!tappProviderState.isInitialized) {
        await initTappletSigner();
    }
    // built-in tapplet
    if (isBuiltIn) {
        const activeTapplet = await invoke('launch_builtin_tapplet');
        useTappletsStore.setState({ activeTapplet });
        return;
    }
    // by default tapplets are supposed to work with the Ootle
    // run the Ootle dev/registed tapplet below
    return;
};

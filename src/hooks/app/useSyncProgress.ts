import { useSetupStore } from '@app/store/useSetupStore.ts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SetupPhase } from '@app/types/events-payloads.ts';
import { useNodeStore } from '@app/store/useNodeStore.ts';

const initialSetupStoreState = useSetupStore.getState();
const initialNodeState = useNodeStore.getState();
interface SyncTitle {
    phaseTitle: string;
    title: string;
    titleParams?: Record<string, string>;
}
export default function useSync() {
    const [copy, setCopy] = useState<SyncTitle>({
        phaseTitle: '',
        title: '',
    });
    const nodeStateRef = useRef(initialNodeState);
    const core = useRef(initialSetupStoreState.core_phase_setup_payload);
    const hardware = useRef(initialSetupStoreState.hardware_phase_setup_payload);
    const node = useRef(initialSetupStoreState.node_phase_setup_payload);
    const mining = useRef(initialSetupStoreState.mining_phase_setup_payload);
    const wallet = useRef(initialSetupStoreState.wallet_phase_setup_payload);

    useEffect(() => useNodeStore.subscribe((state) => (nodeStateRef.current = state)), []);
    useEffect(
        () =>
            useSetupStore.subscribe((state) => {
                core.current = state.core_phase_setup_payload;
                hardware.current = state.hardware_phase_setup_payload;
                node.current = state.node_phase_setup_payload;
                mining.current = state.mining_phase_setup_payload;
                wallet.current = state.wallet_phase_setup_payload;
            }),
        []
    );

    const disabledPhases = useSetupStore((s) => s.disabled_phases);

    const lastUpdate = nodeStateRef.current.backgroundNodeSyncLastUpdate;
    const type = nodeStateRef.current.node_type;

    const walletDisabled = disabledPhases.includes(SetupPhase.Wallet);
    const miningDisabled = disabledPhases.includes(SetupPhase.Mining);
    const hardwareDisabled = disabledPhases.includes(SetupPhase.Hardware);
    const nodeDisabled = disabledPhases.includes(SetupPhase.Node);

    const getCurrentPhase = useCallback(() => {
        let phase = core;
        if (!miningDisabled && (wallet.current?.is_complete || walletDisabled)) {
            phase = mining;
        }
        if (!walletDisabled && hardware.current?.is_complete) {
            phase = wallet;
        }
        if (!hardwareDisabled && node.current?.is_complete) {
            phase = hardware;
        }
        if (!nodeDisabled && core.current?.is_complete) {
            phase = node;
        }
        return phase.current;
    }, [hardwareDisabled, miningDisabled, nodeDisabled, walletDisabled]);

    const getProgress = useCallback(() => {
        const total = 5;
        let progress = 0;

        if (mining.current?.is_complete && (wallet.current?.is_complete || walletDisabled)) {
            progress = 5;
        }

        if (wallet.current?.is_complete) {
            progress = 4;
        }
        if (hardware.current?.is_complete) {
            progress = 3;
        }
        if (node.current?.is_complete) {
            progress = 2;
        }
        if (core.current?.is_complete) {
            progress = 1;
        }

        return {
            progress,
            total,
        };
    }, [walletDisabled]);

    console.debug(`lastUpdate= `, lastUpdate);
    console.debug(`type= `, type);
    return {
        getCurrentPhase,
        getProgress,
    };
}

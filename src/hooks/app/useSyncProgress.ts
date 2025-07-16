import { useSetupStore } from '@app/store/useSetupStore.ts';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { SetupPhase } from '@app/types/events-payloads.ts';
import { useNodeStore } from '@app/store/useNodeStore.ts';

const initialNodeState = useNodeStore.getState();
export default function useSync() {
    const nodeStateRef = useRef(initialNodeState);
    const core = useSetupStore((s) => s.core_phase_setup_payload);
    const hardware = useSetupStore((s) => s.hardware_phase_setup_payload);
    const node = useSetupStore((s) => s.node_phase_setup_payload);
    const mining = useSetupStore((s) => s.mining_phase_setup_payload);
    const wallet = useSetupStore((s) => s.wallet_phase_setup_payload);
    const disabledPhases = useSetupStore((s) => s.disabled_phases);
    useEffect(() => useNodeStore.subscribe((state) => (nodeStateRef.current = state)), []);

    const lastUpdate = nodeStateRef.current.backgroundNodeSyncLastUpdate;
    const type = nodeStateRef.current.node_type;

    const walletDisabled = disabledPhases.includes(SetupPhase.Wallet);

    const getProgress = useCallback(() => {
        const total = 5;
        let progress = 0;

        if (mining?.is_complete && (wallet?.is_complete || walletDisabled)) {
            progress = 5;
        }

        if (wallet?.is_complete) {
            progress = 4;
        }
        if (hardware?.is_complete) {
            progress = 3;
        }
        if (node?.is_complete) {
            progress = 2;
        }
        if (core?.is_complete) {
            progress = 1;
        }

        return {
            progress,
            total,
        };
    }, [
        core?.is_complete,
        hardware?.is_complete,
        mining?.is_complete,
        node?.is_complete,
        wallet?.is_complete,
        walletDisabled,
    ]);

    const currentPhaseToShow = useMemo(() => {
        if (hardware?.is_complete && mining) {
            return mining;
        }
        if (node?.is_complete && hardware) {
            return hardware;
        }
        if (core?.is_complete && node) {
            return node;
        }
        return core;
    }, [core, hardware, node, mining]);

    console.debug(`lastUpdate= `, lastUpdate);
    console.debug(`type= `, type);
    return {
        getProgress,
        setupPhaseTitle: currentPhaseToShow?.phase_title,
        setupTitle: currentPhaseToShow?.title,
        setupProgress: currentPhaseToShow?.progress,
        setupParams: currentPhaseToShow?.title_params ? { ...currentPhaseToShow.title_params } : {},
    };
}

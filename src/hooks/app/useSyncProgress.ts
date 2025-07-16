import { useSetupStore } from '@app/store/useSetupStore.ts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SetupPhase } from '@app/types/events-payloads.ts';
import { useUIStore } from '@app/store';

export default function useSync() {
    const [showSync, setShowSync] = useState(false);

    const isInitialSetupFinished = useSetupStore((state) => state.isInitialSetupFinished);
    const shouldShowSync = useUIStore((state) => state.showResumeAppModal);

    const core = useSetupStore((s) => s.core_phase_setup_payload);
    const hardware = useSetupStore((s) => s.hardware_phase_setup_payload);
    const node = useSetupStore((s) => s.node_phase_setup_payload);
    const mining = useSetupStore((s) => s.mining_phase_setup_payload);
    const wallet = useSetupStore((s) => s.wallet_phase_setup_payload);
    const disabledPhases = useSetupStore((s) => s.disabled_phases);

    const walletDisabled = disabledPhases.includes(SetupPhase.Wallet);
    const miningDisabled = disabledPhases.includes(SetupPhase.Mining);
    const hardwareDisabled = disabledPhases.includes(SetupPhase.Hardware);
    const nodeDisabled = disabledPhases.includes(SetupPhase.Node);

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
        let phase = core;
        if (!miningDisabled && (wallet?.is_complete || walletDisabled)) {
            phase = mining;
        }
        if (!walletDisabled && hardware?.is_complete) {
            phase = wallet;
        }
        if (!hardwareDisabled && node?.is_complete) {
            phase = hardware;
        }
        if (!nodeDisabled && core?.is_complete) {
            phase = node;
        }
        return phase;
    }, [core, miningDisabled, wallet, walletDisabled, hardware, hardwareDisabled, node, nodeDisabled, mining]);

    useEffect(() => {
        const isOpen = shouldShowSync || (!currentPhaseToShow?.is_complete && !isInitialSetupFinished);
        setShowSync(isOpen);
    }, [currentPhaseToShow, isInitialSetupFinished, shouldShowSync]);

    useEffect(() => {
        const hideResumeAppSync =
            mining?.is_complete && (wallet?.is_complete || disabledPhases.includes(SetupPhase.Wallet));

        if (hideResumeAppSync) {
            useUIStore.setState({ showResumeAppModal: false });
        }
    }, [mining?.is_complete, wallet?.is_complete, disabledPhases]);

    return {
        getProgress,
        setupPhaseTitle: currentPhaseToShow?.phase_title,
        setupTitle: currentPhaseToShow?.title,
        setupProgress: currentPhaseToShow?.progress,
        setupParams: currentPhaseToShow?.title_params ? { ...currentPhaseToShow.title_params } : {},
        currentPhaseToShow,
        showSync,
    };
}

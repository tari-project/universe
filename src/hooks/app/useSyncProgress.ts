import { useSetupStore } from '@app/store/useSetupStore.ts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SetupPhase } from '@app/types/events-payloads.ts';
import { useUIStore } from '@app/store';

export default function useSync() {
    const [showSync, setShowSync] = useState(false);

    const isInitialSetupFinished = useSetupStore((state) => state.isInitialSetupFinished);
    const shouldShowSync = useUIStore((state) => state.showResumeAppModal);

    const core_phase = useSetupStore((s) => s.core_phase_setup_payload);
    const cpu_mining_phase = useSetupStore((s) => s.cpu_mining_phase_setup_payload);
    const gpu_mining_phase = useSetupStore((s) => s.gpu_mining_phase_setup_payload);
    const node_phase = useSetupStore((s) => s.node_phase_setup_payload);
    const wallet_phase = useSetupStore((s) => s.wallet_phase_setup_payload);

    const disabledPhases = useSetupStore((s) => s.disabled_phases);
    const nodeDisabled = disabledPhases.includes(SetupPhase.Node);
    const walletDisabled = disabledPhases.includes(SetupPhase.Wallet);
    const cpuMiningDisabled = disabledPhases.includes(SetupPhase.CpuMining);
    const gpuMiningDisabled = disabledPhases.includes(SetupPhase.GpuMining);

    const getProgress = useCallback(() => {
        const total = 5;
        let progress = 0;

        if (
            gpu_mining_phase?.is_completed &&
            cpu_mining_phase?.is_completed &&
            node_phase?.is_completed &&
            (wallet_phase?.is_completed || walletDisabled)
        ) {
            progress = 5;
        }

        if (gpu_mining_phase?.is_completed) {
            progress = 4;
        }
        if (cpu_mining_phase?.is_completed) {
            progress = 3;
        }
        if (node_phase?.is_completed) {
            progress = 2;
        }
        if (core_phase?.is_completed) {
            progress = 1;
        }

        return {
            progress,
            total,
        };
    }, [
        core_phase?.is_completed,
        cpu_mining_phase?.is_completed,
        gpu_mining_phase?.is_completed,
        node_phase?.is_completed,
        wallet_phase?.is_completed,
        walletDisabled,
    ]);

    const currentPhaseToShow = useMemo(() => {
        let phase = core_phase;

        if (!walletDisabled && gpu_mining_phase?.is_completed) {
            phase = wallet_phase;
        }

        if (!cpuMiningDisabled && gpu_mining_phase?.is_completed) {
            phase = cpu_mining_phase;
        }

        if (!gpuMiningDisabled && node_phase?.is_completed) {
            phase = gpu_mining_phase;
        }

        if (!nodeDisabled && core_phase?.is_completed) {
            phase = node_phase;
        }
        return phase;
    }, [
        core_phase,
        wallet_phase,
        walletDisabled,
        node_phase,
        nodeDisabled,
        gpu_mining_phase,
        cpu_mining_phase,
        cpuMiningDisabled,
        gpuMiningDisabled,
    ]);

    useEffect(() => {
        const isOpen = shouldShowSync || (!currentPhaseToShow?.is_completed && !isInitialSetupFinished);
        setShowSync(isOpen);
    }, [currentPhaseToShow, isInitialSetupFinished, shouldShowSync]);

    useEffect(() => {
        const hideResumeAppSync = wallet_phase?.is_completed || disabledPhases.includes(SetupPhase.Wallet);

        if (hideResumeAppSync) {
            useUIStore.setState({ showResumeAppModal: false });
        }
    }, [wallet_phase?.is_completed, disabledPhases]);

    console.log('useSync', {
        setupPhaseTitle: currentPhaseToShow?.phase_title,
        setupTitle: currentPhaseToShow?.title,
        setupProgress: currentPhaseToShow?.progress,
        setupParams: currentPhaseToShow?.title_params,
        isCompleted: currentPhaseToShow?.is_completed,
        currentPhaseToShow,
        showSync,
    });

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

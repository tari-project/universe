import { useSetupStore } from '@app/store/useSetupStore.ts';
import { useMemo } from 'react';

export const useCurrentPhaseDetails = () => {
    const corePhaseInfoPayload = useSetupStore((state) => state.core_phase_setup_payload);
    const cpuMiningInfoPayload = useSetupStore((state) => state.cpu_mining_phase_setup_payload);
    const gpuMiningInfoPayload = useSetupStore((state) => state.gpu_mining_phase_setup_payload);
    const nodePhaseInfoPayload = useSetupStore((state) => state.node_phase_setup_payload);

    const currentPhaseToShow = useMemo(() => {
        if (gpuMiningInfoPayload?.is_completed && cpuMiningInfoPayload) {
            return cpuMiningInfoPayload;
        }
        if (nodePhaseInfoPayload?.is_completed && gpuMiningInfoPayload) {
            return gpuMiningInfoPayload;
        }
        if (corePhaseInfoPayload?.is_completed && nodePhaseInfoPayload) {
            return nodePhaseInfoPayload;
        }
        return corePhaseInfoPayload;
    }, [corePhaseInfoPayload, cpuMiningInfoPayload, gpuMiningInfoPayload, nodePhaseInfoPayload]);

    return {
        setupPhaseTitle: currentPhaseToShow?.phase_title,
        setupTitle: currentPhaseToShow?.title,
        setupProgress: currentPhaseToShow?.progress,
        setupParams: currentPhaseToShow?.title_params ? { ...currentPhaseToShow.title_params } : {},
    };
};

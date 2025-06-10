import { useSetupStore } from '@app/store/useSetupStore.ts';
import { useMemo } from 'react';

export const useCurrentPhaseDetails = () => {
    const corePhaseInfoPayload = useSetupStore((state) => state.core_phase_setup_payload);
    const hardwarePhaseInfoPayload = useSetupStore((state) => state.hardware_phase_setup_payload);
    const nodePhaseInfoPayload = useSetupStore((state) => state.node_phase_setup_payload);
    const miningPhaseInfoPayload = useSetupStore((state) => state.mining_phase_setup_payload);

    const currentPhaseToShow = useMemo(() => {
        if (hardwarePhaseInfoPayload?.is_complete && miningPhaseInfoPayload) {
            return miningPhaseInfoPayload;
        }
        if (nodePhaseInfoPayload?.is_complete && hardwarePhaseInfoPayload) {
            return hardwarePhaseInfoPayload;
        }
        if (corePhaseInfoPayload?.is_complete && nodePhaseInfoPayload) {
            return nodePhaseInfoPayload;
        }
        return corePhaseInfoPayload;
    }, [corePhaseInfoPayload, hardwarePhaseInfoPayload, nodePhaseInfoPayload, miningPhaseInfoPayload]);

    return {
        setupPhaseTitle: currentPhaseToShow?.phase_title,
        setupTitle: currentPhaseToShow?.title,
        setupProgress: currentPhaseToShow?.progress,
        setupParams: currentPhaseToShow?.title_params ? { ...currentPhaseToShow.title_params } : {},
    };
};

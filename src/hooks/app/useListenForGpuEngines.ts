import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useMiningStore } from '@app/store/useMiningStore';

export interface DetectedAvailableGpuEnginesPayload {
    engines: string[];
    selected_engine: string;
}

export const useListenForGpuEngines = () => {
    const setAvailableEngines = useMiningStore((state) => state.setAvailableEngines);

    useEffect(() => {
        const listenerForDetectecAvailableGpuEngines = listen(
            'detected-available-gpu-engines',
            ({ payload }: { payload: DetectedAvailableGpuEnginesPayload }) => {
                setAvailableEngines(payload.engines, payload.selected_engine);
            }
        );

        return () => {
            listenerForDetectecAvailableGpuEngines.then((unlisten) => unlisten());
        };
    }, [setAvailableEngines]);
};

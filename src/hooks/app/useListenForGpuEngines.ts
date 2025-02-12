import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useMiningStore } from '@app/store/useMiningStore';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore';
import { GpuDevice } from '@app/types/app-status';

export interface DetectedAvailableGpuEnginesPayload {
    engines: string[];
    selected_engine: string;
}

export interface DetectedGpuHardwarePayload {
    devices: GpuDevice[];
}

export const useListenForGpuEngines = () => {
    const setAvailableEngines = useMiningStore((state) => state.setAvailableEngines);
    const setGpuDevices = useMiningMetricsStore((state) => state.setGpuDevices);

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

    useEffect(() => {
        const listenerForGpuHardware = listen(
            'detected-devices',
            ({ payload }: { payload: DetectedGpuHardwarePayload }) => {
                console.log('payload.devices', payload.devices);
                setGpuDevices(payload.devices);
            }
        );

        return () => {
            listenerForGpuHardware.then((unlisten) => unlisten());
        };
    }, []);
};

import { useAppStatusStore } from '../store/useAppStatusStore';
import { HardwareParameters } from '../types/app-status';
import { useShallow } from 'zustand/react/shallow';

const roundTo = (num: number, precision = 2) => {
    const factor = 10 ** precision;
    return Math.round(num * factor) / factor;
};

export const useHardwareStatus = () => {
    const hardwareStatus = useAppStatusStore(useShallow((state) => state.hardware_status));

    if (hardwareStatus) {
        const { cpu: cpuRaw, gpu: gpuRaw } = hardwareStatus;

        const gpu: HardwareParameters = {
            label: gpuRaw.label,
            usage_percentage: roundTo(gpuRaw.usage_percentage),
            current_temperature: roundTo(gpuRaw.current_temperature),
            max_temperature: roundTo(gpuRaw.max_temperature),
            status_error: gpuRaw.status_error,
        };

        const cpu: HardwareParameters = {
            label: cpuRaw.label,
            usage_percentage: roundTo(cpuRaw.usage_percentage),
            current_temperature: roundTo(cpuRaw.current_temperature),
            max_temperature: roundTo(cpuRaw.max_temperature),
            status_error: cpuRaw.status_error,
        };

        return { cpu, gpu };
    }

    return { cpu: undefined, gpu: undefined };
};

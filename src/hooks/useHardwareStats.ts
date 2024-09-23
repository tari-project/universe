import { useMiningStore } from '@app/store/useMiningStore';
import { HardwareParameters } from '../types/app-status';
import { useShallow } from 'zustand/react/shallow';
import { useMemo } from 'react';

const roundTo = (num: number, precision = 2) => {
    const factor = 10 ** precision;
    return Math.round(num * factor) / factor;
};

export const useHardwareStats = () => {
    const cpuHardwareStats = useMiningStore(useShallow((s) => s.cpu.hardware));
    const gpuHardwareStats = useMiningStore(useShallow((s) => s.gpu.hardware));

    const cpu = useMemo(() => {
        if (cpuHardwareStats) {
            return {
                label: cpuHardwareStats.label,
                usage_percentage: roundTo(cpuHardwareStats.usage_percentage),
                current_temperature: roundTo(cpuHardwareStats.current_temperature),
                max_temperature: roundTo(cpuHardwareStats.max_temperature),
            } as HardwareParameters;
        }
        return undefined;
    }, [cpuHardwareStats]);

    const gpu = useMemo(() => {
        if (gpuHardwareStats) {
            return {
                label: gpuHardwareStats.label,
                usage_percentage: roundTo(gpuHardwareStats.usage_percentage),
                current_temperature: roundTo(gpuHardwareStats.current_temperature),
                max_temperature: roundTo(gpuHardwareStats.max_temperature),
            } as HardwareParameters;
        }
        return undefined;
    }, [gpuHardwareStats]);

    return { cpu, gpu };
};

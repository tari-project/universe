import { useMiningStore } from '@app/store/useMiningStore';
import { HardwareParameters } from '../types/app-status';
import { useMemo } from 'react';

const roundTo = (num: number, precision = 2) => {
    const factor = 10 ** precision;
    return Math.round(num * factor) / factor;
};

export const useHardwareStats = () => {
    const cpuHardwareStats = useMiningStore((s) => s.cpu.hardware);
    const gpuHardwareStats = useMiningStore((s) => s.gpu.hardware);

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
            return gpuHardwareStats.map((stats) => ({
                label: stats.label,
                usage_percentage: roundTo(stats.usage_percentage),
                current_temperature: roundTo(stats.current_temperature),
                max_temperature: roundTo(stats.max_temperature),
            })) as HardwareParameters[];
        }
        return undefined;
    }, [gpuHardwareStats]);

    return { cpu, gpu };
};

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
            return cpuHardwareStats
                .filter((cpu) => cpu.status.is_reader_implemented)
                .map<HardwareParameters>((stats) => ({
                    label: stats.name,
                    usage_percentage: roundTo(stats.parameters?.usage_percentage ?? 0),
                    current_temperature: roundTo(stats.parameters?.current_temperature ?? 0),
                    max_temperature: roundTo(stats.parameters?.max_temperature ?? 0),
                }));
        }
        return undefined;
    }, [cpuHardwareStats]);

    const gpu = useMemo(() => {
        if (gpuHardwareStats) {
            return gpuHardwareStats
                .filter((gpu) => gpu.status.is_reader_implemented)
                .map<HardwareParameters>((stats) => ({
                    label: stats.name,
                    usage_percentage: roundTo(stats.parameters?.usage_percentage ?? 0),
                    current_temperature: roundTo(stats.parameters?.current_temperature ?? 0),
                    max_temperature: roundTo(stats.parameters?.max_temperature ?? 0),
                }));
        }
        return undefined;
    }, [gpuHardwareStats]);

    const doesAnyCpuHasReadings = cpuHardwareStats?.some((cpu) => cpu.status.is_reader_implemented);
    const doesAnyGpuHasReadings = gpuHardwareStats?.some((gpu) => gpu.status.is_reader_implemented);

    return { cpu, gpu, doesAnyCpuHasReadings, doesAnyGpuHasReadings };
};

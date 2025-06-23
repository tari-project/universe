import { MaxConsumptionLevels } from '@app/types/app-status.ts';
import { PowerLevelUsage } from '@app/store';

function mapGPU(gpus: MaxConsumptionLevels['max_gpus_threads'], maxThreads: number) {
    return (
        gpus?.map((gpu) => ({
            gpu_name: gpu.gpu_name,
            max_gpu_threads: maxThreads,
        })) || []
    );
}
export function getParsedMaxLevels(maxLevels?: MaxConsumptionLevels, isDefault = false): PowerLevelUsage {
    const cpuMax = maxLevels?.max_cpu_threads || 2;
    const gpuMax = maxLevels?.max_gpus_threads || [];

    const ecoCPU = Math.min(Math.round(cpuMax * 0.3), 1);
    const ecoGPU = mapGPU(gpuMax, 2);

    const ludicrousCPU = cpuMax;
    const ludicrousGPU = mapGPU(gpuMax, 1024);

    const customCPU = isDefault ? ecoCPU : cpuMax;
    const customGPU = isDefault ? ecoGPU : gpuMax;

    return {
        eco_mode_max_cpu_usage: ecoCPU,
        eco_mode_max_gpu_usage: ecoGPU,
        ludicrous_mode_max_cpu_usage: ludicrousCPU,
        ludicrous_mode_max_gpu_usage: ludicrousGPU,
        custom_max_cpu_usage: customCPU,
        custom_max_gpu_usage: customGPU,
    };
}

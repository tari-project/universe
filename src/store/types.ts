import { ConfigMining } from '@app/types/configs.ts';

export type displayMode = 'system' | 'dark' | 'light';

const _MINING_MODE_TYPES = ['Eco', 'Ludicrous', 'Custom'] as const;
type MiningModeTuple = typeof _MINING_MODE_TYPES;
export type MiningModeType = MiningModeTuple[number];

export type PowerLevelUsage = Pick<
    ConfigMining,
    | 'eco_mode_max_cpu_usage'
    | 'eco_mode_max_gpu_usage'
    | 'ludicrous_mode_max_cpu_usage'
    | 'ludicrous_mode_max_gpu_usage'
    | 'custom_max_cpu_usage'
    | 'custom_max_gpu_usage'
>;

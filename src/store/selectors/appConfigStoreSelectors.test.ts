import { describe, it, expect } from 'vitest';
import {
    getSelectedCpuPool,
    getSelectedGpuPool,
    getAvailableCpuPools,
    getAvailableGpuPools,
} from './appConfigStoreSelectors';
import { ConfigPools, CpuPools, GpuPools, PoolOrigin, BasePoolData } from '@app/types/configs';

const createMockPool = (name: string, type: CpuPools | GpuPools): BasePoolData => ({
    pool_name: name,
    pool_type: type,
    pool_origin: PoolOrigin.LuckyPool,
    pool_url: `https://${name.toLowerCase()}.example.com`,
    stats_url: `https://${name.toLowerCase()}.example.com/stats`,
});

// Helper type for testing - allows partial pool records
interface TestConfigPools {
    was_config_migrated?: boolean;
    created_at?: string;
    gpu_pool_enabled?: boolean;
    current_gpu_pool?: GpuPools;
    gpu_pools?: Record<string, BasePoolData>;
    cpu_pool_enabled?: boolean;
    current_cpu_pool?: CpuPools;
    cpu_pools?: Record<string, BasePoolData>;
}

describe('appConfigStoreSelectors', () => {
    describe('getSelectedCpuPool', () => {
        it('returns undefined when current_cpu_pool is not set', () => {
            const state: TestConfigPools = {
                current_cpu_pool: undefined,
                cpu_pools: {
                    [CpuPools.LuckyPoolRandomX]: createMockPool('LuckyPool', CpuPools.LuckyPoolRandomX),
                },
            };

            const result = getSelectedCpuPool(state as ConfigPools);
            expect(result).toBeUndefined();
        });

        it('returns undefined when cpu_pools is not set', () => {
            const state: TestConfigPools = {
                current_cpu_pool: CpuPools.LuckyPoolRandomX,
                cpu_pools: undefined,
            };

            const result = getSelectedCpuPool(state as ConfigPools);
            expect(result).toBeUndefined();
        });

        it('returns undefined when selected pool does not exist', () => {
            const state: TestConfigPools = {
                current_cpu_pool: CpuPools.KryptexPoolRandomX,
                cpu_pools: {
                    [CpuPools.LuckyPoolRandomX]: createMockPool('LuckyPool', CpuPools.LuckyPoolRandomX),
                },
            };

            const result = getSelectedCpuPool(state as ConfigPools);
            expect(result).toBeUndefined();
        });

        it('returns the selected pool when it exists', () => {
            const luckyPool = createMockPool('LuckyPool', CpuPools.LuckyPoolRandomX);
            const state: TestConfigPools = {
                current_cpu_pool: CpuPools.LuckyPoolRandomX,
                cpu_pools: {
                    [CpuPools.LuckyPoolRandomX]: luckyPool,
                    [CpuPools.KryptexPoolRandomX]: createMockPool('Kryptex', CpuPools.KryptexPoolRandomX),
                },
            };

            const result = getSelectedCpuPool(state as ConfigPools);
            expect(result).toBe(luckyPool);
        });
    });

    describe('getSelectedGpuPool', () => {
        it('returns undefined when current_gpu_pool is not set', () => {
            const state: TestConfigPools = {
                current_gpu_pool: undefined,
                gpu_pools: {
                    [GpuPools.LuckyPoolC29]: createMockPool('LuckyPool', GpuPools.LuckyPoolC29),
                },
            };

            const result = getSelectedGpuPool(state as ConfigPools);
            expect(result).toBeUndefined();
        });

        it('returns undefined when gpu_pools is not set', () => {
            const state: TestConfigPools = {
                current_gpu_pool: GpuPools.LuckyPoolC29,
                gpu_pools: undefined,
            };

            const result = getSelectedGpuPool(state as ConfigPools);
            expect(result).toBeUndefined();
        });

        it('returns the selected GPU pool when it exists', () => {
            const luckyPool = createMockPool('LuckyPool', GpuPools.LuckyPoolC29);
            const state: TestConfigPools = {
                current_gpu_pool: GpuPools.LuckyPoolC29,
                gpu_pools: {
                    [GpuPools.LuckyPoolC29]: luckyPool,
                    [GpuPools.KryptexPoolC29]: createMockPool('Kryptex', GpuPools.KryptexPoolC29),
                },
            };

            const result = getSelectedGpuPool(state as ConfigPools);
            expect(result).toBe(luckyPool);
        });
    });

    describe('getAvailableCpuPools', () => {
        it('returns empty array when cpu_pools is undefined', () => {
            const state: TestConfigPools = {
                cpu_pools: undefined,
            };

            const result = getAvailableCpuPools(state as ConfigPools);
            expect(result).toEqual([]);
        });

        it('returns all pool values when cpu_pools exists', () => {
            const luckyPool = createMockPool('LuckyPool', CpuPools.LuckyPoolRandomX);
            const kryptexPool = createMockPool('Kryptex', CpuPools.KryptexPoolRandomX);
            const state: TestConfigPools = {
                cpu_pools: {
                    [CpuPools.LuckyPoolRandomX]: luckyPool,
                    [CpuPools.KryptexPoolRandomX]: kryptexPool,
                },
            };

            const result = getAvailableCpuPools(state as ConfigPools);
            expect(result).toHaveLength(2);
            expect(result).toContain(luckyPool);
            expect(result).toContain(kryptexPool);
        });

        it('returns empty array when cpu_pools is empty object', () => {
            const state: TestConfigPools = {
                cpu_pools: {},
            };

            const result = getAvailableCpuPools(state as ConfigPools);
            expect(result).toEqual([]);
        });
    });

    describe('getAvailableGpuPools', () => {
        it('returns empty array when gpu_pools is undefined', () => {
            const state: TestConfigPools = {
                gpu_pools: undefined,
            };

            const result = getAvailableGpuPools(state as ConfigPools);
            expect(result).toEqual([]);
        });

        it('returns all pool values when gpu_pools exists', () => {
            const luckyPool = createMockPool('LuckyPool', GpuPools.LuckyPoolC29);
            const kryptexPool = createMockPool('Kryptex', GpuPools.KryptexPoolC29);
            const state: TestConfigPools = {
                gpu_pools: {
                    [GpuPools.LuckyPoolC29]: luckyPool,
                    [GpuPools.KryptexPoolC29]: kryptexPool,
                },
            };

            const result = getAvailableGpuPools(state as ConfigPools);
            expect(result).toHaveLength(2);
            expect(result).toContain(luckyPool);
            expect(result).toContain(kryptexPool);
        });
    });
});

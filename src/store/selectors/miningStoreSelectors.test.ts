import { describe, it, expect } from 'vitest';
import { getSelectedMiner } from './miningStoreSelectors';
import { MiningStoreState } from '../useMiningStore';
import { GpuMiner, GpuMinerType, GpuMinerFeature, GpuMiningAlgorithm } from '@app/types/events-payloads';

const createMockMiner = (minerType: GpuMinerType): GpuMiner => ({
    miner_type: minerType,
    features: [GpuMinerFeature.PoolMining],
    supported_algorithms: [GpuMiningAlgorithm.C29],
    is_healthy: true,
});

describe('miningStoreSelectors', () => {
    describe('getSelectedMiner', () => {
        it('returns undefined when selectedMiner is not set', () => {
            const state: Partial<MiningStoreState> = {
                selectedMiner: undefined,
                availableMiners: {
                    [GpuMinerType.LolMiner]: createMockMiner(GpuMinerType.LolMiner),
                },
            };

            const result = getSelectedMiner(state as MiningStoreState);
            expect(result).toBeUndefined();
        });

        it('returns undefined when availableMiners is not set', () => {
            const state: Partial<MiningStoreState> = {
                selectedMiner: GpuMinerType.LolMiner,
                availableMiners: undefined,
            };

            const result = getSelectedMiner(state as MiningStoreState);
            expect(result).toBeUndefined();
        });

        it('returns undefined when both are not set', () => {
            const state: Partial<MiningStoreState> = {
                selectedMiner: undefined,
                availableMiners: undefined,
            };

            const result = getSelectedMiner(state as MiningStoreState);
            expect(result).toBeUndefined();
        });

        it('returns the selected miner when both are set', () => {
            const lolMiner = createMockMiner(GpuMinerType.LolMiner);
            const state: Partial<MiningStoreState> = {
                selectedMiner: GpuMinerType.LolMiner,
                availableMiners: {
                    [GpuMinerType.LolMiner]: lolMiner,
                },
            };

            const result = getSelectedMiner(state as MiningStoreState);
            expect(result).toBe(lolMiner);
        });

        it('returns undefined when selected miner not in available miners', () => {
            const state: Partial<MiningStoreState> = {
                selectedMiner: 'NonExistent' as GpuMinerType,
                availableMiners: {
                    [GpuMinerType.LolMiner]: createMockMiner(GpuMinerType.LolMiner),
                },
            };

            const result = getSelectedMiner(state as MiningStoreState);
            expect(result).toBeUndefined();
        });
    });
});

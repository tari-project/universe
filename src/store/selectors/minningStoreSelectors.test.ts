import { describe, it, expect } from 'vitest';
import { getSelectedMiner, getIsGpuSoloMiningSupported } from './minningStoreSelectors';
import { MiningStoreState } from '../useMiningStore';
import { GpuMiner, GpuMinerType, GpuMinerFeature, MiningAlgorithm } from '@app/types/events-payloads';

const createMockMiner = (
    minerType: GpuMinerType,
    features: GpuMinerFeature[] = [GpuMinerFeature.PoolMining]
): GpuMiner => ({
    miner_type: minerType,
    features,
    supported_algorithms: [MiningAlgorithm.C29],
    is_healthy: true,
});

describe('minningStoreSelectors', () => {
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

    describe('getIsGpuSoloMiningSupported', () => {
        it('returns undefined when availableMiners has not been received yet', () => {
            const state: Partial<MiningStoreState> = { availableMiners: undefined };

            expect(getIsGpuSoloMiningSupported(state as MiningStoreState)).toBeUndefined();
        });

        it('returns false when no available miner advertises solo mining', () => {
            const state: Partial<MiningStoreState> = {
                availableMiners: {
                    [GpuMinerType.LolMiner]: createMockMiner(GpuMinerType.LolMiner, [
                        GpuMinerFeature.PoolMining,
                        GpuMinerFeature.DeviceExclusion,
                    ]),
                },
            };

            expect(getIsGpuSoloMiningSupported(state as MiningStoreState)).toBe(false);
        });

        it('returns false when the miner list is empty', () => {
            const state: Partial<MiningStoreState> = {
                availableMiners: {} as MiningStoreState['availableMiners'],
            };

            expect(getIsGpuSoloMiningSupported(state as MiningStoreState)).toBe(false);
        });

        it('returns true when a miner advertises solo mining', () => {
            const state: Partial<MiningStoreState> = {
                availableMiners: {
                    [GpuMinerType.LolMiner]: createMockMiner(GpuMinerType.LolMiner, [
                        GpuMinerFeature.SoloMining,
                        GpuMinerFeature.PoolMining,
                    ]),
                },
            };

            expect(getIsGpuSoloMiningSupported(state as MiningStoreState)).toBe(true);
        });

        it('returns true when only one of several miners advertises solo mining', () => {
            // Built via fromEntries rather than an object literal: GpuMinerType currently has a
            // single variant, so two computed keys would collide as a duplicate property.
            const soloCapableMiner = 'SoloCapableMiner' as GpuMinerType;
            const state: Partial<MiningStoreState> = {
                availableMiners: Object.fromEntries([
                    [GpuMinerType.LolMiner, createMockMiner(GpuMinerType.LolMiner, [GpuMinerFeature.PoolMining])],
                    [soloCapableMiner, createMockMiner(soloCapableMiner, [GpuMinerFeature.SoloMining])],
                ]) as MiningStoreState['availableMiners'],
            };

            expect(getIsGpuSoloMiningSupported(state as MiningStoreState)).toBe(true);
        });
    });
});

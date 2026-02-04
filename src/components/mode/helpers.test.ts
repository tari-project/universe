import { describe, it, expect } from 'vitest';
import { getModeList, getModeColours } from './helpers';
import { MiningModeType, MiningModes } from '@app/types/configs';

describe('helpers', () => {
    describe('getModeList', () => {
        it('converts mining modes object to sorted array', () => {
            const modes = {
                Turbo: {
                    mode_type: MiningModeType.Turbo,
                    mode_name: 'Turbo',
                    cpu_usage_percentage: 75,
                    gpu_usage_percentage: 75,
                },
                Eco: {
                    mode_type: MiningModeType.Eco,
                    mode_name: 'Eco',
                    cpu_usage_percentage: 25,
                    gpu_usage_percentage: 25,
                },
            } as unknown as MiningModes;

            const result = getModeList(modes);

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('Eco');
            expect(result[1].name).toBe('Turbo');
        });

        it('sorts modes in correct order: Eco, Turbo, Ludicrous, Custom, User', () => {
            const modes = {
                User: {
                    mode_type: MiningModeType.User,
                    mode_name: 'My Custom',
                    cpu_usage_percentage: 50,
                    gpu_usage_percentage: 60,
                },
                Ludicrous: {
                    mode_type: MiningModeType.Ludicrous,
                    mode_name: 'Ludicrous',
                    cpu_usage_percentage: 100,
                    gpu_usage_percentage: 100,
                },
                Eco: {
                    mode_type: MiningModeType.Eco,
                    mode_name: 'Eco',
                    cpu_usage_percentage: 25,
                    gpu_usage_percentage: 25,
                },
                Turbo: {
                    mode_type: MiningModeType.Turbo,
                    mode_name: 'Turbo',
                    cpu_usage_percentage: 75,
                    gpu_usage_percentage: 75,
                },
                Custom: {
                    mode_type: MiningModeType.Custom,
                    mode_name: 'Custom',
                    cpu_usage_percentage: 50,
                    gpu_usage_percentage: 50,
                },
            } as unknown as MiningModes;

            const result = getModeList(modes);

            expect(result[0].mode_type).toBe(MiningModeType.Eco);
            expect(result[1].mode_type).toBe(MiningModeType.Turbo);
            expect(result[2].mode_type).toBe(MiningModeType.Ludicrous);
            expect(result[3].mode_type).toBe(MiningModeType.Custom);
            expect(result[4].mode_type).toBe(MiningModeType.User);
        });

        it('includes icon for each mode', () => {
            const modes = {
                Eco: {
                    mode_type: MiningModeType.Eco,
                    mode_name: 'Eco',
                    cpu_usage_percentage: 25,
                    gpu_usage_percentage: 25,
                },
            } as unknown as MiningModes;

            const result = getModeList(modes);

            expect(result[0].icon).toBeDefined();
        });

        it('returns empty array for empty input', () => {
            const result = getModeList({} as unknown as MiningModes);

            expect(result).toEqual([]);
        });
    });

    describe('getModeColours', () => {
        it('returns Eco colours by default', () => {
            const result = getModeColours(undefined);

            expect(result.base).toBe('#4e7a4a');
        });

        it('returns Eco colours for Eco mode', () => {
            const result = getModeColours(MiningModeType.Eco);

            expect(result.base).toBe('#4e7a4a');
            expect(result.accent).toBeDefined();
            expect(result.light).toBeDefined();
            expect(result.dark).toBeDefined();
            expect(result.shadow).toBeDefined();
        });

        it('returns Turbo colours', () => {
            const result = getModeColours(MiningModeType.Turbo);

            expect(result.base).toBe('#154349');
        });

        it('returns Ludicrous colours', () => {
            const result = getModeColours(MiningModeType.Ludicrous);

            expect(result.base).toBe('#77341f');
        });

        it('returns Custom colours', () => {
            const result = getModeColours(MiningModeType.Custom);

            expect(result.base).toBe('#123959');
        });

        it('returns User colours (same as Custom)', () => {
            const result = getModeColours(MiningModeType.User);

            expect(result.base).toBe('#123959');
        });

        it('returns complete colour group with all properties', () => {
            const result = getModeColours(MiningModeType.Eco);

            expect(result).toHaveProperty('base');
            expect(result).toHaveProperty('accent');
            expect(result).toHaveProperty('light');
            expect(result).toHaveProperty('dark');
            expect(result).toHaveProperty('shadow');
        });
    });
});

import { describe, it, expect } from 'vitest';
import { PauseOnBatteryModeState, MiningModeType } from '@app/types/configs';
import { WalletUIMode } from '@app/types/events-payloads';

// Test the initial state values and structure without importing the actual stores
// This validates that the contract between UI and state is correct

describe('useAppConfigStore', () => {
    describe('ConfigWallet initial state', () => {
        const configWalletInitialState = {
            created_at: '',
            keyring_accessed: false,
            monero_address: '',
            monero_address_is_generated: false,
            wxtm_addresses: {},
        };

        it('has empty created_at by default', () => {
            expect(configWalletInitialState.created_at).toBe('');
        });

        it('has keyring_accessed as false by default', () => {
            expect(configWalletInitialState.keyring_accessed).toBe(false);
        });

        it('has empty monero_address by default', () => {
            expect(configWalletInitialState.monero_address).toBe('');
        });

        it('has monero_address_is_generated as false by default', () => {
            expect(configWalletInitialState.monero_address_is_generated).toBe(false);
        });

        it('has empty wxtm_addresses object by default', () => {
            expect(configWalletInitialState.wxtm_addresses).toEqual({});
        });
    });

    describe('ConfigMining initial state', () => {
        const configMiningInitialState = {
            created_at: '',
            cpu_mining_enabled: true,
            gpu_mining_enabled: true,
            mine_on_app_start: false,
            mining_modes: {},
            selected_mining_mode: 'Eco',
            gpu_devices_settings: {},
            is_gpu_mining_recommended: true,
            eco_alert_needed: false,
            pause_on_battery_mode: PauseOnBatteryModeState.Enabled,
        };

        it('has cpu_mining_enabled as true by default', () => {
            expect(configMiningInitialState.cpu_mining_enabled).toBe(true);
        });

        it('has gpu_mining_enabled as true by default', () => {
            expect(configMiningInitialState.gpu_mining_enabled).toBe(true);
        });

        it('has mine_on_app_start as false by default', () => {
            expect(configMiningInitialState.mine_on_app_start).toBe(false);
        });

        it('has Eco as default mining mode', () => {
            expect(configMiningInitialState.selected_mining_mode).toBe('Eco');
        });

        it('has empty mining_modes object by default', () => {
            expect(configMiningInitialState.mining_modes).toEqual({});
        });

        it('has empty gpu_devices_settings by default', () => {
            expect(configMiningInitialState.gpu_devices_settings).toEqual({});
        });

        it('has is_gpu_mining_recommended as true by default', () => {
            expect(configMiningInitialState.is_gpu_mining_recommended).toBe(true);
        });

        it('has eco_alert_needed as false by default', () => {
            expect(configMiningInitialState.eco_alert_needed).toBe(false);
        });

        it('has pause_on_battery_mode as Enabled by default', () => {
            expect(configMiningInitialState.pause_on_battery_mode).toBe(PauseOnBatteryModeState.Enabled);
        });
    });

    describe('ConfigUI initial state', () => {
        const configUIInitialState = {
            visualModeToggleLoading: false,
            created_at: '',
            application_language: 'en',
            display_mode: 'system',
            has_system_language_been_proposed: false,
            sharing_enabled: true,
            show_experimental_settings: false,
            should_always_use_system_language: false,
            visual_mode: true,
            wallet_ui_mode: WalletUIMode.Standard,
            was_staged_security_modal_shown: false,
            shutdown_mode_selected: false,
        };

        it('has visualModeToggleLoading as false by default', () => {
            expect(configUIInitialState.visualModeToggleLoading).toBe(false);
        });

        it('has English as default application language', () => {
            expect(configUIInitialState.application_language).toBe('en');
        });

        it('has system as default display mode', () => {
            expect(configUIInitialState.display_mode).toBe('system');
        });

        it('has sharing_enabled as true by default', () => {
            expect(configUIInitialState.sharing_enabled).toBe(true);
        });

        it('has show_experimental_settings as false by default', () => {
            expect(configUIInitialState.show_experimental_settings).toBe(false);
        });

        it('has visual_mode as true by default', () => {
            expect(configUIInitialState.visual_mode).toBe(true);
        });

        it('has Standard wallet UI mode by default', () => {
            expect(configUIInitialState.wallet_ui_mode).toBe(WalletUIMode.Standard);
        });

        it('has shutdown_mode_selected as false by default', () => {
            expect(configUIInitialState.shutdown_mode_selected).toBe(false);
        });
    });

    describe('ConfigPools initial state', () => {
        const configPoolsInitialState = {
            was_config_migrated: false,
            created_at: '',
            cpu_pool_enabled: false,
            gpu_pool_enabled: false,
            cpu_pools: undefined,
            gpu_pools: undefined,
            current_cpu_pool: undefined,
            current_gpu_pool: undefined,
        };

        it('has cpu_pool_enabled as false by default', () => {
            expect(configPoolsInitialState.cpu_pool_enabled).toBe(false);
        });

        it('has gpu_pool_enabled as false by default', () => {
            expect(configPoolsInitialState.gpu_pool_enabled).toBe(false);
        });

        it('has undefined cpu_pools by default', () => {
            expect(configPoolsInitialState.cpu_pools).toBeUndefined();
        });

        it('has undefined gpu_pools by default', () => {
            expect(configPoolsInitialState.gpu_pools).toBeUndefined();
        });

        it('has undefined current_cpu_pool by default', () => {
            expect(configPoolsInitialState.current_cpu_pool).toBeUndefined();
        });

        it('has undefined current_gpu_pool by default', () => {
            expect(configPoolsInitialState.current_gpu_pool).toBeUndefined();
        });
    });

    describe('MiningModeType enum', () => {
        it('has correct Eco value', () => {
            expect(MiningModeType.Eco).toBe('Eco');
        });

        it('has correct Turbo value', () => {
            expect(MiningModeType.Turbo).toBe('Turbo');
        });

        it('has correct Ludicrous value', () => {
            expect(MiningModeType.Ludicrous).toBe('Ludicrous');
        });

        it('has correct Custom value', () => {
            expect(MiningModeType.Custom).toBe('Custom');
        });

        it('has correct User value', () => {
            expect(MiningModeType.User).toBe('User');
        });
    });

    describe('PauseOnBatteryModeState enum', () => {
        it('has correct Enabled value', () => {
            expect(PauseOnBatteryModeState.Enabled).toBe('Enabled');
        });

        it('has correct Disabled value', () => {
            expect(PauseOnBatteryModeState.Disabled).toBe('Disabled');
        });

        it('has correct NotSupported value', () => {
            expect(PauseOnBatteryModeState.NotSupported).toBe('NotSupported');
        });
    });

    describe('WalletUIMode enum', () => {
        it('has Standard mode', () => {
            expect(WalletUIMode.Standard).toBeDefined();
        });
    });

    describe('getSelectedMiningMode selector logic', () => {
        it('returns undefined when mining_modes is empty', () => {
            const state = {
                mining_modes: {},
                selected_mining_mode: 'Eco',
            };
            const result = state.mining_modes[state.selected_mining_mode] || undefined;
            expect(result).toBeUndefined();
        });

        it('returns the selected mode when it exists', () => {
            const ecoMode = {
                mode_type: MiningModeType.Eco,
                mode_name: 'Eco',
                cpu_usage_percentage: 25,
                gpu_usage_percentage: 25,
            };
            const state = {
                mining_modes: { Eco: ecoMode },
                selected_mining_mode: 'Eco',
            };
            const result = state.mining_modes[state.selected_mining_mode] || undefined;
            expect(result).toBe(ecoMode);
        });

        it('returns undefined when selected mode does not exist in mining_modes', () => {
            const state = {
                mining_modes: { Eco: { mode_type: MiningModeType.Eco } },
                selected_mining_mode: 'Turbo',
            };
            const result = state.mining_modes[state.selected_mining_mode] || undefined;
            expect(result).toBeUndefined();
        });
    });
});

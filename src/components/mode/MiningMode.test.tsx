/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({
        onCloseRequested: vi.fn(),
        listen: vi.fn(),
    })),
}));

vi.mock('@app/store/actions/appConfigStoreActions', () => ({
    selectMiningMode: vi.fn().mockResolvedValue(undefined),
}));

import { render, screen, fireEvent } from '@app/test/test-utils';
import { MiningMode } from './MiningMode';
import { useConfigMiningStore } from '@app/store';
import { MiningModeType, PauseOnBatteryModeState } from '@app/types/configs';

const mockMiningModes = {
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
    Ludicrous: {
        mode_type: MiningModeType.Ludicrous,
        mode_name: 'Ludicrous',
        cpu_usage_percentage: 100,
        gpu_usage_percentage: 100,
    },
};

function setupStore() {
    useConfigMiningStore.setState({
        mining_modes: mockMiningModes,
        selected_mining_mode: 'Eco',
        cpu_mining_enabled: true,
        gpu_mining_enabled: true,
        mine_on_app_start: false,
        created_at: '',
        gpu_devices_settings: {},
        is_gpu_mining_recommended: true,
        eco_alert_needed: false,
        pause_on_battery_mode: PauseOnBatteryModeState.Enabled,
        getSelectedMiningMode: () => mockMiningModes.Eco,
    });
}

describe('MiningMode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupStore();
    });

    describe('rendering', () => {
        it('renders with mode name visible', () => {
            render(<MiningMode />);

            expect(screen.getByText('Eco')).toBeInTheDocument();
        });

        it('renders trigger with combobox role', () => {
            render(<MiningMode />);

            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        it('renders with aria-haspopup attribute', () => {
            render(<MiningMode />);

            expect(screen.getByRole('combobox')).toHaveAttribute('aria-haspopup', 'listbox');
        });

        it('renders in closed state by default', () => {
            render(<MiningMode />);

            expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
        });
    });

    describe('open state', () => {
        it('shows all mode options when opened', () => {
            render(<MiningMode open={true} />);

            const options = screen.getAllByRole('option');
            expect(options.length).toBeGreaterThanOrEqual(3);
        });

        it('marks selected mode with aria-selected', () => {
            render(<MiningMode open={true} />);

            const ecoOption = screen.getByRole('option', { name: /Eco/i });
            expect(ecoOption).toHaveAttribute('aria-selected', 'true');
        });

        it('contains mode names in options', () => {
            render(<MiningMode open={true} />);

            expect(screen.getByText('Turbo')).toBeInTheDocument();
            expect(screen.getByText('Ludicrous')).toBeInTheDocument();
        });
    });

    describe('variants', () => {
        it('renders primary variant by default', () => {
            render(<MiningMode />);

            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        it('renders secondary variant', () => {
            render(<MiningMode variant="secondary" />);

            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });
    });

    describe('scheduler callback', () => {
        it('calls scheduler callback when selecting a mode', () => {
            const schedulerCallback = vi.fn();
            render(<MiningMode open={true} handleSchedulerMiningModeCallback={schedulerCallback} />);

            const turboOption = screen.getByRole('option', { name: /Turbo/i });
            fireEvent.click(turboOption);

            expect(schedulerCallback).toHaveBeenCalledWith('Turbo');
        });
    });

    describe('mode icons', () => {
        it('displays mode icons in the trigger', () => {
            render(<MiningMode />);

            const icons = document.querySelectorAll('.option-icon');
            expect(icons.length).toBeGreaterThan(0);
        });
    });
});

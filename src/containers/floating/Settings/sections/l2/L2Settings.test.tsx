import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { render, screen } from '@app/test/test-utils';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useMiningStore } from '@app/store';
import { initialState, useL2WalletStore } from '@app/store/useL2WalletStore.ts';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';
import type { L2WalletState } from '@app/types/events-payloads.ts';
import { Network } from '@app/utils/network';
import SettingsNavigation from '../../components/Navigation.tsx';
import { L2Settings } from './L2Settings';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/plugin-shell', () => ({ open: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

const enabledState: L2WalletState = {
    enabled: true,
    accounts: [
        {
            name: 'recovered-account-0',
            address: 'otl_esm_test',
            component_address: 'component_test',
            public_key: 'ab'.repeat(32),
            is_default: true,
            balance: { revealed: 0, confidential: 0 },
            history: [],
            transactions: [],
        },
    ],
};

const serve = (state: L2WalletState) =>
    vi
        .mocked(invoke)
        .mockImplementation((async (cmd: string) => (cmd === 'l2_get_state' ? state : undefined)) as typeof invoke);

describe('Layer 2 settings tab', () => {
    it('is only listed on Esmeralda', () => {
        useMiningStore.setState({ network: Network.MainNet });
        const { unmount } = render(<SettingsNavigation activeSection="general" onChangeActiveSection={vi.fn()} />);
        expect(screen.queryByTestId('settings-tab-l2')).not.toBeInTheDocument();
        expect(screen.getByTestId('settings-tab-wallet')).toBeInTheDocument();
        unmount();

        useMiningStore.setState({ network: Network.Esmeralda });
        render(<SettingsNavigation activeSection="general" onChangeActiveSection={vi.fn()} />);
        expect(screen.getByTestId('settings-tab-l2')).toBeInTheDocument();
    });
});

describe('L2Settings', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        useL2WalletStore.setState({ ...initialState }, true);
        useConfigCoreStore.setState({ ootle_indexer_url: undefined });
    });

    it('asks for a PIN and does not touch L2 when none is set', () => {
        useWalletStore.setState({ is_pin_locked: false });
        serve(enabledState);
        render(<L2Settings />);

        expect(screen.getByTestId('l2-settings-pin-required')).toBeInTheDocument();
        expect(screen.queryByTestId('l2-settings-account')).not.toBeInTheDocument();
        expect(invoke).not.toHaveBeenCalled();
    });

    it('offers Enable Layer 2 when a PIN is set but L2 is off', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(initialState);
        render(<L2Settings />);

        expect(await screen.findByTestId('l2-settings-enable')).toBeInTheDocument();
        expect(invoke).toHaveBeenCalledWith('l2_get_state');
        expect(screen.queryByTestId('l2-settings-account')).not.toBeInTheDocument();
    });

    it('shows the default account address, public key and the indexer once enabled', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        useConfigCoreStore.setState({ ootle_indexer_url: 'http://54.38.0.31:50124/' });
        serve(enabledState);
        render(<L2Settings />);

        expect(await screen.findByTestId('l2-settings-address')).toHaveTextContent('otl_esm_test');
        expect(screen.getByTestId('l2-settings-public-key')).toHaveTextContent('ab'.repeat(32));
        expect(screen.getByTestId('l2-settings-indexer')).toHaveTextContent('http://54.38.0.31:50124/');
        expect(screen.queryByTestId('l2-settings-enable')).not.toBeInTheDocument();
    });

    it('leaves the indexer out when the config has none', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(enabledState);
        render(<L2Settings />);

        await screen.findByTestId('l2-settings-address');
        expect(screen.queryByTestId('l2-settings-indexer')).not.toBeInTheDocument();
    });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useMiningStore } from '@app/store';
import { initialState, useL2WalletStore } from '@app/store/useL2WalletStore.ts';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';
import { useConfigUIStore } from '@app/store/useAppConfigStore.ts';
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
    seed_source: 'l1',
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

        expect(await screen.findByTestId('l2-settings-address')).toHaveValue('otl_esm_test');
        expect(screen.getByTestId('l2-settings-public-key')).toHaveValue('ab'.repeat(32));
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

    it('picks the seed words note from seed_source and offers the L1 seed back only after an import', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(enabledState);
        const { unmount } = render(<L2Settings />);

        expect(await screen.findByTestId('l2-settings-seed-note')).toHaveTextContent('l2.seed-note-l1');
        expect(screen.queryByTestId('l2-settings-use-l1-seed')).not.toBeInTheDocument();
        unmount();

        serve({ ...enabledState, seed_source: 'imported' });
        render(<L2Settings />);
        await waitFor(() =>
            expect(screen.getByTestId('l2-settings-seed-note')).toHaveTextContent('l2.seed-note-imported')
        );
        fireEvent.click(screen.getByTestId('l2-settings-use-l1-seed'));
        fireEvent.click(await screen.findByTestId('l2-settings-use-l1-seed-confirm'));
        await waitFor(() => expect(invoke).toHaveBeenCalledWith('l2_use_l1_seed', undefined));
    });

    it('saves the side by side choice', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        useConfigUIStore.setState({ l2_side_by_side: false });
        serve(enabledState);
        render(<L2Settings />);

        fireEvent.click(await screen.findByTestId('l2-settings-side-by-side'));
        expect(useConfigUIStore.getState().l2_side_by_side).toBe(true);
        expect(invoke).toHaveBeenCalledWith('set_l2_side_by_side', { enabled: true });
    });

    it('hides the seed words section when L2 is off', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(initialState);
        render(<L2Settings />);

        await screen.findByTestId('l2-settings-enable');
        expect(screen.queryByTestId('l2-settings-seed-words')).not.toBeInTheDocument();
    });

    it('imports L2 seed words only after the confirm dialog', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(enabledState);
        render(<L2Settings />);
        const words = Array.from({ length: 24 }, (_, i) => `word${i}`);

        fireEvent.click(await screen.findByTestId('wallet-seed-edit'));
        fireEvent.change(screen.getByTestId('wallet-seed-input'), { target: { value: words.join(' ') } });
        await waitFor(() => expect(screen.getByTestId('wallet-seed-submit')).toBeEnabled());
        fireEvent.click(screen.getByTestId('wallet-seed-submit'));

        const confirm = await screen.findByTestId('wallet-import-confirm');
        expect(screen.getByText('l2.confirm-import')).toBeInTheDocument();
        expect(invoke).not.toHaveBeenCalledWith('l2_import_seed_words', expect.anything());
        fireEvent.click(confirm);
        await waitFor(() => expect(invoke).toHaveBeenCalledWith('l2_import_seed_words', { seedWords: words }));
    });
});

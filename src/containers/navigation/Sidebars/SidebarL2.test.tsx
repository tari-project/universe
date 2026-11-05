import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { act, render, screen, waitFor } from '@app/test/test-utils';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { initialState, useL2WalletStore } from '@app/store/useL2WalletStore.ts';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { FEATURE_FLAGS } from '@app/store/consts.ts';
import { Network } from '@app/utils/network.ts';
import type { L2WalletState } from '@app/types/events-payloads.ts';
import SidebarL2 from './SidebarL2';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

const noAccounts: L2WalletState = { enabled: true, locked: false, seed_source: 'l1', accounts: [] };
const LIVE = [FEATURE_FLAGS.FF_OOTLE_MAINNET_LIVE as string];

describe('SidebarL2', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        vi.mocked(invoke).mockImplementation((async (cmd: string) =>
            cmd === 'l2_get_state'
                ? noAccounts
                : cmd === 'l2_default_claim_public_key'
                  ? 'cd'.repeat(32)
                  : undefined) as typeof invoke);
        useL2WalletStore.setState({ ...initialState }, true);
        useWalletStore.setState({ is_pin_locked: true });
        useMiningStore.setState({ network: Network.MainNet });
        useAirdropStore.setState({
            features: undefined,
            config: { 'ootle-mainnet-launch-at': '2999-01-01T00:00:00Z' },
        });
    });

    it('shows the launch countdown and pre-launch wallet before the live flag', async () => {
        render(<SidebarL2 />);

        expect(await screen.findByTestId('l2-wallet')).toBeInTheDocument();
        expect(screen.getByTestId('l2-launch-countdown')).toBeInTheDocument();
        expect(screen.queryByTestId('l2-tiles')).not.toBeInTheDocument();
        expect(screen.queryByTestId('l2-loading')).not.toBeInTheDocument();
    });

    it('renders as today once the live flag is on', async () => {
        useAirdropStore.setState({ features: LIVE });
        render(<SidebarL2 />);

        await waitFor(() => expect(invoke).toHaveBeenCalledWith('l2_get_state'));
        expect(screen.getByTestId('l2-tiles')).toBeInTheDocument();
        expect(screen.getByTestId('l2-loading')).toBeInTheDocument();
        expect(screen.queryByTestId('l2-launch-countdown')).not.toBeInTheDocument();
    });

    it('renders as today off MainNet whatever the flags say', async () => {
        useMiningStore.setState({ network: Network.Esmeralda });
        render(<SidebarL2 />);

        await waitFor(() => expect(invoke).toHaveBeenCalledWith('l2_get_state'));
        expect(screen.getByTestId('l2-tiles')).toBeInTheDocument();
        expect(screen.getByTestId('l2-loading')).toBeInTheDocument();
    });

    it('switches modes live when a feature refetch adds or removes the flag', async () => {
        render(<SidebarL2 />);
        expect(await screen.findByTestId('l2-wallet')).toBeInTheDocument();

        act(() => useAirdropStore.setState({ features: LIVE }));
        expect(await screen.findByTestId('l2-loading')).toBeInTheDocument();
        expect(screen.getByTestId('l2-tiles')).toBeInTheDocument();
        expect(screen.queryByTestId('l2-launch-countdown')).not.toBeInTheDocument();

        act(() => useAirdropStore.setState({ features: [] }));
        expect(await screen.findByTestId('l2-wallet')).toBeInTheDocument();
        expect(screen.getByTestId('l2-launch-countdown')).toBeInTheDocument();
        expect(screen.queryByTestId('l2-tiles')).not.toBeInTheDocument();
    });
});

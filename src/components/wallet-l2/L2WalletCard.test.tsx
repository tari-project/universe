import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { fireEvent, render, screen, waitFor, within } from '@app/test/test-utils';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
import { initialState, useL2WalletStore } from '@app/store/useL2WalletStore.ts';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { FEATURE_FLAGS } from '@app/store/consts.ts';
import { Network } from '@app/utils/network.ts';
import type { L2WalletState } from '@app/types/events-payloads.ts';
import L2WalletCard from './L2WalletCard';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

const enabledState: L2WalletState = {
    enabled: true,
    locked: false,
    seed_source: 'l1',
    accounts: [
        {
            name: 'recovered-account-0',
            address: 'otl_esm_test',
            component_address: 'component_test',
            public_key: 'ab'.repeat(32),
            is_default: true,
            balance: { revealed: 1_000_000, confidential: 2_000_000, total: '3000000' },
            history: [{ id: 1, transaction_id: null, amount: 1_234_567_890, source: 'scan', timestamp: 1 }],
            transactions: [],
        },
    ],
};

const serve = (state: L2WalletState) =>
    vi
        .mocked(invoke)
        .mockImplementation((async (cmd: string) =>
            cmd === 'l2_get_state' ? state : cmd === 'l2_claimable_burns' ? [] : undefined) as typeof invoke);

describe('L2WalletCard', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        useL2WalletStore.setState({ ...initialState }, true);
        useMiningStore.setState({ network: undefined });
        useAirdropStore.setState({ features: undefined });
    });

    it('stays on the loading state while the PIN flag is unknown and does not fetch or close', () => {
        useWalletStore.setState({ is_pin_locked: undefined });
        useUIStore.setState({ l2Open: true });
        serve(enabledState);
        render(<L2WalletCard />);

        expect(screen.getByTestId('l2-loading')).toBeInTheDocument();
        expect(useUIStore.getState().l2Open).toBe(true);
        expect(invoke).not.toHaveBeenCalled();
    });

    it('closes itself without a PIN and does not touch L2', () => {
        useWalletStore.setState({ is_pin_locked: false });
        useUIStore.setState({ l2Open: true });
        serve(enabledState);
        render(<L2WalletCard />);

        expect(useUIStore.getState().l2Open).toBe(false);
        expect(screen.queryByTestId('l2-wallet')).not.toBeInTheDocument();
        expect(invoke).not.toHaveBeenCalled();
    });

    it.each([
        ['locked', { enabled: true, locked: true, seed_source: 'l1', accounts: [] }],
        ['not enabled', initialState],
    ] as [string, L2WalletState][])('closes itself when L2 is %s, with no unlock screen', async (_, state) => {
        useWalletStore.setState({ is_pin_locked: true });
        useUIStore.setState({ l2Open: true });
        serve(state);
        render(<L2WalletCard />);

        await waitFor(() => expect(useUIStore.getState().l2Open).toBe(false));
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('stays open while a seed change reopens the wallet', () => {
        useWalletStore.setState({ is_pin_locked: true });
        useUIStore.setState({ l2Open: true });
        useL2WalletStore.setState({ seedChangePending: true });
        serve(initialState);
        render(<L2WalletCard />);

        expect(useUIStore.getState().l2Open).toBe(true);
    });

    it('masks amounts the way L1 does when the balance is hidden', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        useUIStore.setState({ hideWalletBalance: true });
        serve(enabledState);
        render(<L2WalletCard />);

        expect(await screen.findByTestId('l2-balance')).toHaveTextContent('******* TARI');
        expect(screen.getByTestId('l2-history-row')).toHaveTextContent('***TARI');
        useUIStore.setState({ hideWalletBalance: false });
    });

    it('shows the wallet once L2 is enabled', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(enabledState);
        render(<L2WalletCard />);

        expect(await screen.findByTestId('l2-balance')).toHaveTextContent('3 TARI');
        expect(screen.getAllByTestId('l2-history-row')).toHaveLength(1);
        expect(screen.getByTestId('l2-history-row')).toHaveTextContent('+1.23kTARI');
        expect(screen.queryByTestId('l2-enable')).not.toBeInTheDocument();
    });

    it('names the default account Ootle Wallet, not the recovery name', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(enabledState);
        render(<L2WalletCard />);

        expect(await screen.findByText('l2.account-name')).toBeInTheDocument();
        expect(screen.queryByText('recovered-account-0')).not.toBeInTheDocument();
    });

    it('keeps Burn disabled while the L1 wallet is still scanning', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(enabledState);
        render(<L2WalletCard />);

        expect(await screen.findByTestId('l2-burn-button')).toBeDisabled();
    });

    it('opens the burn form with the default account key as the claim key', async () => {
        useWalletStore.setState({
            is_pin_locked: true,
            wallet_scanning: { scanned_height: 1, total_height: 1, progress: 100, is_initial_scan_complete: true },
        });
        serve(enabledState);
        render(<L2WalletCard />);

        fireEvent.click(await screen.findByTestId('l2-burn-button'));
        expect(await screen.findByDisplayValue('ab'.repeat(32))).toBeInTheDocument();
        expect(screen.getByText('burn.claim-key-default')).toBeInTheDocument();
    });

    it('forgets a send that was closed while processing', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        let finishSend: (id: string) => void = () => undefined;
        vi.mocked(invoke).mockImplementation((async (cmd: string) => {
            if (cmd === 'l2_get_state') return enabledState;
            if (cmd === 'l2_claimable_burns') return [];
            if (cmd === 'l2_send') return new Promise<string>((resolve) => (finishSend = resolve));
        }) as typeof invoke);
        render(<L2WalletCard />);

        fireEvent.click(await screen.findByTestId('l2-send-button'));
        const [addressInput, amountInput] = await screen.findAllByRole('textbox');
        fireEvent.change(addressInput, { target: { value: 'otl_esm_good' } });
        fireEvent.change(amountInput, { target: { value: '1' } });
        await waitFor(() => expect(screen.getByTestId('l2-send-review-button')).toBeEnabled());
        fireEvent.click(screen.getByTestId('l2-send-review-button'));
        fireEvent.click(await screen.findByTestId('l2-send-confirm-button'));
        await screen.findByTestId('l2-send-status');

        fireEvent.click(screen.getByTestId('modal-close'));
        finishSend('tx-1');

        fireEvent.click(await screen.findByTestId('l2-send-button'));
        expect(await screen.findAllByRole('textbox')).toHaveLength(2);
        expect(screen.queryByTestId('l2-send-status')).not.toBeInTheDocument();
    });

    it('shows View details on a hovered history row', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(enabledState);
        render(<L2WalletCard />);
        const row = await screen.findByTestId('l2-history-row');
        fireEvent.mouseEnter(row);
        fireEvent.click(await screen.findByTestId('l2-row-details'));
        expect(await screen.findByText('history.transaction-details')).toBeInTheDocument();
        expect(screen.getByText('+1,234.56 TARI')).toBeInTheDocument();
    });

    it('filters the feed between burns and history', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        const burn = {
            commitment: 'aa'.repeat(32),
            claim_public_key: 'ab'.repeat(32),
            amount: 1,
            proof_file: null,
            timestamp: 2,
        };
        vi.mocked(invoke).mockImplementation((async (cmd: string) =>
            cmd === 'l2_get_state'
                ? enabledState
                : cmd === 'l2_claimable_burns'
                  ? [{ ...burn, status: 'pending' }]
                  : cmd === 'get_stalled_transactions'
                    ? []
                    : undefined) as typeof invoke);
        render(<L2WalletCard />);
        const pick = async (label: string) => {
            fireEvent.click(within(screen.getByTestId('l2-history-filter')).getByRole('combobox'));
            fireEvent.click(await screen.findByRole('option', { name: label }));
        };

        expect(await screen.findByTestId('l2-claim-row')).toBeInTheDocument();
        expect(screen.getByTestId('l2-history-row')).toBeInTheDocument();

        await pick('transactions');
        expect(screen.queryByTestId('l2-claim-row')).not.toBeInTheDocument();
        expect(screen.getByTestId('l2-history-row')).toBeInTheDocument();

        await pick('l2.filter.waiting-claims');
        expect(await screen.findByTestId('l2-claim-row')).toBeInTheDocument();
        expect(screen.queryByTestId('l2-history-row')).not.toBeInTheDocument();
    });

    describe('before the Ootle mainnet launch', () => {
        const CLAIM_KEY = 'cd'.repeat(32);
        const noAccounts: L2WalletState = { ...enabledState, accounts: [] };
        const scanned = {
            scanned_height: 1,
            total_height: 1,
            progress: 100,
            is_initial_scan_complete: true,
        };
        const serveWithKey = (state: L2WalletState, key: () => Promise<string>) =>
            vi
                .mocked(invoke)
                .mockImplementation((async (cmd: string) =>
                    cmd === 'l2_get_state'
                        ? state
                        : cmd === 'l2_default_claim_public_key'
                          ? key()
                          : undefined) as typeof invoke);

        beforeEach(() => {
            useMiningStore.setState({ network: Network.MainNet });
            useWalletStore.setState({ is_pin_locked: true, wallet_scanning: scanned });
        });

        it.each([
            ['not loaded yet', undefined],
            ['loaded without the live flag', ['polling']],
        ])('shows the pre-launch wallet with no accounts while features are %s', async (_, features) => {
            useAirdropStore.setState({ features });
            serveWithKey(noAccounts, async () => CLAIM_KEY);
            render(<L2WalletCard />);

            expect(await screen.findByTestId('l2-balance')).toHaveTextContent('0 TARI');
            expect(screen.queryByTestId('l2-loading')).not.toBeInTheDocument();
            expect(screen.queryByTestId('l2-copy-address')).not.toBeInTheDocument();
            expect(screen.getByTestId('l2-history-empty')).toHaveTextContent('l2.empty');
            expect(screen.queryByTestId('l2-history-row')).not.toBeInTheDocument();
            // Burns live on L1 and on disk, so the pre-burn list loads them without an L2 account.
            await waitFor(() => expect(invoke).toHaveBeenCalledWith('l2_claimable_burns'));
        });

        it('shows the pre-launch wallet even when L2 already has an account', async () => {
            serveWithKey(enabledState, async () => CLAIM_KEY);
            render(<L2WalletCard />);

            expect(await screen.findByTestId('l2-balance')).toHaveTextContent('0 TARI');
            expect(screen.queryByTestId('l2-history-row')).not.toBeInTheDocument();
        });

        it('disables Send and Receive, and clicking them opens nothing', async () => {
            serveWithKey(noAccounts, async () => CLAIM_KEY);
            render(<L2WalletCard />);

            const send = await screen.findByTestId('l2-send-button');
            const receive = screen.getByTestId('l2-receive-button');
            expect(send).toBeDisabled();
            expect(receive).toBeDisabled();
            fireEvent.click(send);
            fireEvent.click(receive);
            expect(screen.queryByText('l2.receive-title')).not.toBeInTheDocument();
            expect(screen.queryAllByRole('textbox')).toHaveLength(0);
        });

        it('opens the burn form with the locally derived default claim key', async () => {
            serveWithKey(noAccounts, async () => CLAIM_KEY);
            render(<L2WalletCard />);

            const burn = await screen.findByTestId('l2-burn-button');
            await waitFor(() => expect(burn).toBeEnabled());
            fireEvent.click(burn);
            expect(await screen.findByDisplayValue(CLAIM_KEY)).toBeInTheDocument();
            expect(invoke).toHaveBeenCalledWith('l2_default_claim_public_key');
        });

        it('keeps Burn disabled until the claim key loads', async () => {
            let resolveKey: (key: string) => void = () => undefined;
            serveWithKey(noAccounts, () => new Promise<string>((resolve) => (resolveKey = resolve)));
            render(<L2WalletCard />);

            const burn = await screen.findByTestId('l2-burn-button');
            expect(burn).toBeDisabled();
            resolveKey(CLAIM_KEY);
            await waitFor(() => expect(burn).toBeEnabled());
        });

        it('keeps Burn disabled when the claim key command fails', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            serveWithKey(noAccounts, async () => {
                throw 'Layer 2 is locked';
            });
            render(<L2WalletCard />);

            const burn = await screen.findByTestId('l2-burn-button');
            await waitFor(() => expect(warn).toHaveBeenCalled());
            expect(burn).toBeDisabled();
            warn.mockRestore();
        });

        it('keeps Burn disabled while the L1 wallet is still scanning', async () => {
            useWalletStore.setState({ wallet_scanning: { ...scanned, is_initial_scan_complete: false } });
            serveWithKey(noAccounts, async () => CLAIM_KEY);
            render(<L2WalletCard />);

            const burn = await screen.findByTestId('l2-burn-button');
            await waitFor(() => expect(invoke).toHaveBeenCalledWith('l2_default_claim_public_key'));
            expect(burn).toBeDisabled();
        });

        it('renders the normal wallet once the live flag is on', async () => {
            useAirdropStore.setState({ features: [FEATURE_FLAGS.FF_OOTLE_MAINNET_LIVE] });
            serve(enabledState);
            render(<L2WalletCard />);

            expect(await screen.findByTestId('l2-balance')).toHaveTextContent('3 TARI');
            expect(screen.getByTestId('l2-copy-address')).toBeInTheDocument();
            expect(invoke).not.toHaveBeenCalledWith('l2_default_claim_public_key');
        });

        it('keeps the loading state with no account once the live flag is on', async () => {
            useAirdropStore.setState({ features: [FEATURE_FLAGS.FF_OOTLE_MAINNET_LIVE] });
            serve(noAccounts);
            render(<L2WalletCard />);

            await waitFor(() => expect(invoke).toHaveBeenCalledWith('l2_get_state'));
            expect(screen.getByTestId('l2-loading')).toBeInTheDocument();
        });

        it('renders the normal wallet on LocalNet without any flags', async () => {
            useMiningStore.setState({ network: Network.LocalNet });
            serve(enabledState);
            render(<L2WalletCard />);

            expect(await screen.findByTestId('l2-balance')).toHaveTextContent('3 TARI');
            expect(screen.getByTestId('l2-copy-address')).toBeInTheDocument();
            expect(invoke).not.toHaveBeenCalledWith('l2_default_claim_public_key');
        });

        it('shows the pre-launch wallet on Esmeralda too', async () => {
            useMiningStore.setState({ network: Network.Esmeralda });
            serve(noAccounts);
            render(<L2WalletCard />);

            expect(await screen.findByTestId('l2-balance')).toHaveTextContent('0 TARI');
            expect(screen.queryByTestId('l2-loading')).not.toBeInTheDocument();
        });
    });
});

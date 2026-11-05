import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { act, fireEvent, render, screen, waitFor, within } from '@app/test/test-utils';
import type { L2Account, L2Burn, L2NetworkStats } from '@app/types/events-payloads.ts';
import L2Activity from './L2Activity';
import { useL2WalletStore } from '@app/store/useL2WalletStore.ts';
import { useToastStore } from '@app/components/ToastStack/useToastStore.tsx';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { FEATURE_FLAGS } from '@app/store/consts.ts';
import { Network } from '@app/utils/network.ts';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/plugin-dialog', () => ({ save: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

const account = { public_key: 'ab'.repeat(32), history: [], transactions: [] } as unknown as L2Account;
const burn = (commitment: string, status: L2Burn['status'], timestamp = 0): L2Burn => ({
    commitment,
    claim_public_key: account.public_key,
    amount: 1_000_000_000,
    proof_file: status === 'pending' ? null : `${commitment}.json`,
    status,
    mined_height: status === 'pending' ? null : 0,
    timestamp,
});
const serveBurns = (burns: L2Burn[]) =>
    vi.mocked(invoke).mockImplementation((async (cmd: string) => {
        if (cmd === 'l2_claimable_burns') return burns;
        if (cmd === 'get_stalled_transactions') return [];
    }) as typeof invoke);
const REJECTION = 'L2 claim failed: ownership proof validation failed';

describe('L2Activity', () => {
    beforeEach(() => {
        vi.mocked(save).mockReset();
        vi.mocked(invoke).mockReset();
        vi.mocked(invoke).mockImplementation((async (cmd: string) => {
            if (cmd === 'l2_claimable_burns') {
                return [
                    burn('aa'.repeat(32), 'claimable'),
                    burn('bb'.repeat(32), 'pending'),
                    burn('cc'.repeat(32), 'claimed'),
                ];
            }
            if (cmd === 'l2_claim_burn') throw REJECTION;
            if (cmd === 'get_stalled_transactions') return [];
        }) as typeof invoke);
    });

    it('replaces a mined burn value with Save proof on hover', async () => {
        vi.mocked(save).mockResolvedValue('/backup/proof.json');
        render(<L2Activity account={account} filter="all-activity" />);
        const rows = await screen.findAllByTestId('l2-claim-row');
        expect(rows).toHaveLength(2);
        expect(screen.queryByTestId('l2-save-proof-button')).not.toBeInTheDocument();
        expect(within(rows[0]).getByTestId('l2-burn-value')).toHaveTextContent('1kXTR');
        fireEvent.mouseEnter(rows[0]);
        expect(within(rows[0]).getByTestId('l2-burn-value')).toHaveTextContent('burn.backup-button');
        expect(within(rows[0]).getByTestId('l2-claim-button')).toBeInTheDocument();
        fireEvent.click(await within(rows[0]).findByTestId('l2-save-proof-button'));
        await waitFor(() =>
            expect(invoke).toHaveBeenCalledWith('save_burn_proof', {
                proofFile: `${'aa'.repeat(32)}.json`,
                destination: '/backup/proof.json',
            })
        );
        fireEvent.mouseEnter(rows[1]);
        expect(within(rows[1]).queryByTestId('l2-save-proof-button')).not.toBeInTheDocument();
        expect(within(rows[1]).getByTestId('l2-burn-value')).toHaveTextContent('1kXTR');
    });

    it('offers Save proof in burn details after mining', async () => {
        render(<L2Activity account={account} filter="all-activity" />);
        const rows = await screen.findAllByTestId('l2-claim-row');
        fireEvent.click(within(rows[0]).getByRole('button', { name: 'burn.details-title' }));
        expect(await screen.findByTestId('l2-save-proof-button')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('modal-close'));
        fireEvent.click(within(rows[1]).getByRole('button', { name: 'burn.details-title' }));
        expect(screen.queryByTestId('l2-save-proof-button')).not.toBeInTheDocument();
    });

    it('marks a stalled burn and offers to abandon it', async () => {
        vi.mocked(invoke).mockImplementation((async (cmd: string) => {
            if (cmd === 'l2_claimable_burns') return [burn('bb'.repeat(32), 'pending')];
            if (cmd === 'get_stalled_transactions') {
                return [{ tx_id: '12', amount: 1_000_000_000, burn_commitment: 'bb'.repeat(32) }];
            }
        }) as typeof invoke);
        render(<L2Activity account={account} filter="all-activity" />);

        await waitFor(() =>
            expect(screen.getAllByTestId('l2-claim-chip').map((chip) => chip.textContent)).toEqual(['abandon.chip'])
        );
        fireEvent.click(screen.getByTestId('l2-burn-abandon'));
        expect(await screen.findByTestId('tx-details-abandon')).toBeInTheDocument();
    });

    it('lists unclaimed burns, a Pending chip on the unmined one and Claim on the claimable one', async () => {
        render(<L2Activity account={account} filter="all-activity" />);
        await waitFor(() => expect(screen.getAllByTestId('l2-claim-row')).toHaveLength(2));
        expect(screen.getAllByTestId('l2-claim-button')).toHaveLength(1);
        expect(screen.getByText('l2.claim.pending')).toBeInTheDocument();
        expect(screen.getByText('l2.claim.ready')).toBeInTheDocument();
        expect(screen.getAllByTestId('l2-claim-chip').map((chip) => chip.textContent)).toEqual([
            'l2.claim.chip-pending',
        ]);
        expect(screen.getAllByTestId('l2-claim-row')[0]).toHaveTextContent('1kXTR');
    });

    it('mixes burns with history newest first and never shows the proof file', async () => {
        serveBurns([burn('aa'.repeat(32), 'claimable', 300), burn('bb'.repeat(32), 'pending', 100)]);
        const history = [
            { id: 1, transaction_id: null, amount: 5, source: 'scan', timestamp: 200 },
            { id: 2, transaction_id: null, amount: 5, source: 'scan', timestamp: 400 },
        ] as L2Account['history'];
        render(<L2Activity account={{ ...account, history }} filter="all-activity" />);
        await screen.findAllByTestId('l2-claim-row');
        const rows = screen.getAllByTestId(/^l2-(claim|history)-row$/);
        expect(rows.map((row) => row.getAttribute('data-testid'))).toEqual([
            'l2-history-row',
            'l2-claim-row',
            'l2-history-row',
            'l2-claim-row',
        ]);
        expect(rows[1]).toHaveAttribute('title', 'aa'.repeat(32));
        expect(rows.map((row) => row.textContent).join('')).not.toContain('.json');
    });

    it('claims by commitment and shows the rejection', async () => {
        render(<L2Activity account={account} filter="all-activity" />);
        fireEvent.click(await screen.findByTestId('l2-claim-button'));
        expect(invoke).toHaveBeenCalledWith('l2_claim_burn', { commitment: 'aa'.repeat(32) });
        await waitFor(() => expect(useToastStore.getState().toasts.slice(-1)[0]?.text).toContain(REJECTION));
    });

    it('lists a burn to a key this wallet does not hold without a chip or Claim button', async () => {
        serveBurns([burn('dd'.repeat(32), 'foreign')]);
        render(<L2Activity account={account} filter="all-activity" />);
        expect(await screen.findByText('l2.claim.foreign')).toBeInTheDocument();
        expect(screen.queryByTestId('l2-claim-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('l2-claim-chip')).not.toBeInTheDocument();
    });

    it('shows a Waiting chip instead of Claim until the L2 has imported the burn block', async () => {
        useL2WalletStore.setState({
            networkStats: { block_height: 1000, block_target_secs: 120 } as L2NetworkStats,
        });
        serveBurns([
            { ...burn('ee'.repeat(32), 'claimable', 2), mined_height: 1030 },
            { ...burn('ff'.repeat(32), 'claimable', 1), mined_height: 1000 },
        ]);
        render(<L2Activity account={account} filter="all-activity" />);
        const rows = await screen.findAllByTestId('l2-claim-row');
        expect(rows[0]).toHaveTextContent('l2.claim.claimable-in');
        expect(rows[0]).toHaveTextContent('l2.claim.chip-waiting');
        expect(rows[0].querySelector('[data-testid="l2-claim-button"]')).toBeNull();
        expect(rows[1]).toHaveTextContent('l2.claim.ready');
        expect(rows[1].querySelector('[data-testid="l2-claim-chip"]')).toBeNull();
        expect(screen.getAllByTestId('l2-claim-button')).toHaveLength(1);
        useL2WalletStore.setState({ networkStats: null });
    });

    it('holds the Claim button while the node has not said where the burn was mined', async () => {
        serveBurns([{ ...burn('ee'.repeat(32), 'claimable'), mined_height: null }]);
        render(<L2Activity account={account} filter="all-activity" />);
        expect(await screen.findByText('l2.claim.checking')).toBeInTheDocument();
        expect(screen.queryByTestId('l2-claim-button')).not.toBeInTheDocument();
    });

    it('drops a burn list that lands after a newer one was requested', async () => {
        const pending: ((burns: L2Burn[]) => void)[] = [];
        vi.mocked(invoke).mockImplementation((async (cmd: string) =>
            cmd === 'l2_claimable_burns'
                ? new Promise<L2Burn[]>((resolve) => pending.push(resolve))
                : undefined) as typeof invoke);
        const { rerender } = render(<L2Activity account={account} filter="all-activity" />);
        rerender(<L2Activity account={{ ...account }} filter="all-activity" />);
        await waitFor(() => expect(pending).toHaveLength(2));

        await act(async () => pending[1]([]));
        await act(async () => pending[0]([burn('aa'.repeat(32), 'claimable')]));
        expect(screen.queryByTestId('l2-claim-row')).not.toBeInTheDocument();
    });

    it('shows the empty text when only claimed burns are left', async () => {
        serveBurns([burn('cc'.repeat(32), 'claimed')]);
        render(<L2Activity account={account} filter="all-activity" />);
        await waitFor(() => expect(invoke).toHaveBeenCalledWith('l2_claimable_burns'));
        expect(screen.queryByTestId('l2-claim-row')).not.toBeInTheDocument();
        expect(screen.getByTestId('l2-history-empty')).toBeInTheDocument();
    });
});

describe('L2Activity before the Ootle launch', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        serveBurns([
            burn('aa'.repeat(32), 'claimable'),
            burn('bb'.repeat(32), 'pending'),
            burn('cc'.repeat(32), 'claimed'),
        ]);
        useMiningStore.setState({ network: Network.MainNet });
        useAirdropStore.setState({ features: undefined });
        useL2WalletStore.setState({ accounts: [] });
    });

    it('lists pre-burns without an L2 account, with Save proof but no Claim', async () => {
        render(<L2Activity filter="all-activity" />);
        const rows = await screen.findAllByTestId('l2-claim-row');

        expect(rows).toHaveLength(2);
        expect(screen.queryByTestId('l2-history-empty')).not.toBeInTheDocument();
        expect(within(rows[0]).getByTestId('l2-claim-status')).toHaveTextContent('l2.claim.after-launch');
        expect(within(rows[1]).getByTestId('l2-claim-status')).toHaveTextContent('l2.claim.pending');
        expect(screen.queryByTestId('l2-claim-button')).not.toBeInTheDocument();
        fireEvent.mouseEnter(rows[0]);
        expect(within(rows[0]).getByTestId('l2-save-proof-button')).toBeInTheDocument();
    });

    it('refetches when a state update arrives, though there is still no account', async () => {
        render(<L2Activity filter="all-activity" />);
        await screen.findAllByTestId('l2-claim-row');

        serveBurns([
            burn('aa'.repeat(32), 'claimable'),
            burn('bb'.repeat(32), 'claimable'),
            burn('dd'.repeat(32), 'pending'),
        ]);
        act(() => useL2WalletStore.setState({ accounts: [] }));
        await waitFor(() => expect(screen.getAllByTestId('l2-claim-row')).toHaveLength(3));
    });

    it('offers Claim once the live flag is on', async () => {
        useAirdropStore.setState({ features: [FEATURE_FLAGS.FF_OOTLE_MAINNET_LIVE] });
        render(<L2Activity account={account} filter="all-activity" />);
        const rows = await screen.findAllByTestId('l2-claim-row');

        expect(within(rows[0]).getByTestId('l2-claim-button')).toBeInTheDocument();
        expect(within(rows[0]).getByTestId('l2-claim-status')).not.toHaveTextContent('l2.claim.after-launch');
    });
});

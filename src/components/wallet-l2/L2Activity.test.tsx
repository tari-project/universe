import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import type { L2Account, L2Burn, L2NetworkStats } from '@app/types/events-payloads.ts';
import L2Activity from './L2Activity';
import { useL2WalletStore } from '@app/store/useL2WalletStore.ts';
import { useToastStore } from '@app/components/ToastStack/useToastStore.tsx';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
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
    vi
        .mocked(invoke)
        .mockImplementation((async (cmd: string) =>
            cmd === 'l2_claimable_burns' ? burns : undefined) as typeof invoke);
const REJECTION = 'L2 claim failed: ownership proof validation failed';

describe('L2Activity', () => {
    beforeEach(() => {
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
        }) as typeof invoke);
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

    it('shows the empty text when only claimed burns are left', async () => {
        serveBurns([burn('cc'.repeat(32), 'claimed')]);
        render(<L2Activity account={account} filter="all-activity" />);
        await waitFor(() => expect(invoke).toHaveBeenCalledWith('l2_claimable_burns'));
        expect(screen.queryByTestId('l2-claim-row')).not.toBeInTheDocument();
        expect(screen.getByTestId('l2-history-empty')).toBeInTheDocument();
    });
});

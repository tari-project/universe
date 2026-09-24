import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import type { L2Account, L2Burn } from '@app/types/events-payloads.ts';
import L2ClaimBurns from './L2ClaimBurns';
import { useToastStore } from '@app/components/ToastStack/useToastStore.tsx';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

const account = { public_key: 'ab'.repeat(32) } as L2Account;
const burn = (commitment: string, status: L2Burn['status']): L2Burn => ({
    commitment,
    claim_public_key: account.public_key,
    amount: 1_000_000_000,
    proof_file: status === 'pending' ? null : `${commitment}.json`,
    status,
    last_error: null,
    not_yet_claimable: false,
});
const REJECTION = 'L2 claim failed: ownership proof validation failed';

describe('L2ClaimBurns', () => {
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

    it('lists unclaimed burns with a Claim button only on the claimable one', async () => {
        render(<L2ClaimBurns account={account} />);
        await waitFor(() => expect(screen.getAllByTestId('l2-claim-row')).toHaveLength(2));
        expect(screen.getAllByTestId('l2-claim-button')).toHaveLength(1);
        expect(screen.getByText('l2.claim.pending')).toBeInTheDocument();
        expect(screen.getByText('l2.claim.ready')).toBeInTheDocument();
        expect(screen.getAllByTestId('l2-claim-row')[0]).toHaveTextContent('1kXTR');
    });

    it('keeps the backend order (newest first) and never shows the proof file', async () => {
        render(<L2ClaimBurns account={account} />);
        const rows = await screen.findAllByTestId('l2-claim-row');
        expect(rows.map((row) => row.getAttribute('title'))).toEqual(['aa'.repeat(32), 'bb'.repeat(32)]);
        expect(screen.getByTestId('l2-claim-burns')).not.toHaveTextContent('.json');
    });

    it('claims by commitment and shows the rejection', async () => {
        render(<L2ClaimBurns account={account} />);
        fireEvent.click(await screen.findByTestId('l2-claim-button'));
        expect(invoke).toHaveBeenCalledWith('l2_claim_burn', { commitment: 'aa'.repeat(32) });
        await waitFor(() => expect(useToastStore.getState().toasts.slice(-1)[0]?.text).toContain(REJECTION));
    });

    it('shows why the last claim was rejected, and hides Claim while the L2 has not seen the burn', async () => {
        vi.mocked(invoke).mockImplementation((async (cmd: string) =>
            cmd === 'l2_claimable_burns'
                ? [
                      { ...burn('aa'.repeat(32), 'claimable'), last_error: 'Insufficient funds' },
                      {
                          ...burn('bb'.repeat(32), 'claimable'),
                          last_error: 'is not yet claimable',
                          not_yet_claimable: true,
                      },
                  ]
                : undefined) as typeof invoke);
        render(<L2ClaimBurns account={account} />);
        await waitFor(() => expect(screen.getAllByTestId('l2-claim-button')).toHaveLength(1));
        const statuses = screen.getAllByTestId('l2-claim-status').map((s) => s.textContent);
        expect(statuses).toEqual(['l2.claim.rejected', 'l2.claim.not-yet-claimable']);
    });

    it('lists a burn to a key this wallet does not hold without a Claim button', async () => {
        vi.mocked(invoke).mockImplementation((async (cmd: string) =>
            cmd === 'l2_claimable_burns' ? [burn('dd'.repeat(32), 'foreign')] : undefined) as typeof invoke);
        render(<L2ClaimBurns account={account} />);
        expect(await screen.findByText('l2.claim.foreign')).toBeInTheDocument();
        expect(screen.queryByTestId('l2-claim-button')).not.toBeInTheDocument();
    });

    it('renders nothing without burns to claim', async () => {
        vi.mocked(invoke).mockImplementation((async (cmd: string) =>
            cmd === 'l2_claimable_burns' ? [burn('cc'.repeat(32), 'claimed')] : undefined) as typeof invoke);
        render(<L2ClaimBurns account={account} />);
        await waitFor(() => expect(invoke).toHaveBeenCalledWith('l2_claimable_burns'));
        expect(screen.queryByTestId('l2-claim-burns')).not.toBeInTheDocument();
    });
});

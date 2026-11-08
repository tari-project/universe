import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { useAppStateStore } from '@app/store/appStateStore';
import OrphanedWalletRecoveryDialog from './OrphanedWalletRecoveryDialog';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ listen: vi.fn(), onCloseRequested: vi.fn() })),
}));

const PLAIN_CANDIDATE = {
    wallet_id: 'abc123',
    redacted_address: '12abc1...xyz789',
    full_address: '12abc1234567890fulladdressxyz789',
};

const PIN_CANDIDATE = {
    wallet_id: 'pin456',
    redacted_address: '14pin4...uvw456',
    full_address: '14pin4567890fulladdressuvw456',
};

describe('OrphanedWalletRecoveryDialog', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        vi.mocked(invoke).mockResolvedValue(undefined);
        useAppStateStore.setState({ orphanedWalletRecovery: undefined });
    });

    it('lists plain candidates with redacted address, reveals full address on demand, and restores in place', async () => {
        useAppStateStore.setState({
            orphanedWalletRecovery: {
                plain_candidates: [PLAIN_CANDIDATE],
                pin_protected_count: 0,
            },
        });

        render(<OrphanedWalletRecoveryDialog />);

        expect(screen.getByText(PLAIN_CANDIDATE.redacted_address)).toBeInTheDocument();
        expect(screen.queryByText(PLAIN_CANDIDATE.full_address)).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('common:orphaned-wallet-reveal-address'));
        expect(screen.getByText(PLAIN_CANDIDATE.full_address)).toBeInTheDocument();

        fireEvent.click(screen.getByText('common:orphaned-wallet-hide-address'));
        expect(screen.getByText(PLAIN_CANDIDATE.redacted_address)).toBeInTheDocument();

        fireEvent.click(screen.getByText('common:orphaned-wallet-restore'));
        await waitFor(() => expect(useAppStateStore.getState().orphanedWalletRecovery).toBeUndefined());
        expect(invoke).toHaveBeenCalledWith('restore_orphaned_wallet_candidate', {
            walletId: 'abc123',
        });
    });

    it('unlocks PIN-protected candidates without consuming entries on a non-matching PIN', async () => {
        useAppStateStore.setState({
            orphanedWalletRecovery: {
                plain_candidates: [],
                pin_protected_count: 1,
            },
        });

        render(<OrphanedWalletRecoveryDialog />);
        expect(screen.getByTestId('orphaned-wallet-pin-section')).toBeInTheDocument();

        // Wrong PIN returns empty list and leaves the PIN section intact
        vi.mocked(invoke).mockResolvedValueOnce([] as never);
        fireEvent.change(screen.getByTestId('orphaned-wallet-pin-input'), {
            target: { value: '0000' },
        });
        fireEvent.click(screen.getByTestId('orphaned-wallet-pin-submit'));

        expect(await screen.findByText('common:orphaned-wallet-pin-no-match')).toBeInTheDocument();
        expect(screen.getByTestId('orphaned-wallet-pin-section')).toBeInTheDocument();

        // Matching PIN unlocks the entry and allows restoring it with the PIN
        vi.mocked(invoke).mockResolvedValueOnce([PIN_CANDIDATE] as never);
        fireEvent.change(screen.getByTestId('orphaned-wallet-pin-input'), {
            target: { value: '4242' },
        });
        fireEvent.click(screen.getByTestId('orphaned-wallet-pin-submit'));

        expect(await screen.findByText(PIN_CANDIDATE.redacted_address)).toBeInTheDocument();
        expect(screen.queryByTestId('orphaned-wallet-pin-section')).not.toBeInTheDocument();

        vi.mocked(invoke).mockResolvedValueOnce(undefined);
        fireEvent.click(screen.getByText('common:orphaned-wallet-restore'));

        await waitFor(() => expect(useAppStateStore.getState().orphanedWalletRecovery).toBeUndefined());
        expect(invoke).toHaveBeenLastCalledWith('restore_orphaned_wallet_candidate', {
            walletId: 'pin456',
            pin: '4242',
        });
    });

    it('supports restoring directly from 24 seed words', async () => {
        useAppStateStore.setState({
            orphanedWalletRecovery: {
                plain_candidates: [PLAIN_CANDIDATE],
                pin_protected_count: 0,
            },
        });

        render(<OrphanedWalletRecoveryDialog />);
        fireEvent.click(screen.getByText('common:orphaned-wallet-seed-import'));

        const words = Array.from({ length: 24 }, (_, idx) => `word${idx + 1}`);
        fireEvent.change(screen.getByTestId('orphaned-wallet-seed-input'), {
            target: { value: words.join(' ') },
        });
        fireEvent.click(screen.getByTestId('orphaned-wallet-seed-submit'));

        await waitFor(() => expect(useAppStateStore.getState().orphanedWalletRecovery).toBeUndefined());
        expect(invoke).toHaveBeenCalledWith('import_seed_words', { seedWords: words });
    });

    it('offers starting fresh with a new wallet as a secondary choice', async () => {
        useAppStateStore.setState({
            orphanedWalletRecovery: {
                plain_candidates: [PLAIN_CANDIDATE],
                pin_protected_count: 1,
            },
        });

        render(<OrphanedWalletRecoveryDialog />);
        fireEvent.click(screen.getByText('common:wallet-config-missing-start-fresh'));

        await waitFor(() => expect(useAppStateStore.getState().orphanedWalletRecovery).toBeUndefined());
        expect(invoke).toHaveBeenCalledWith('discard_unreadable_wallet_config');
    });
});

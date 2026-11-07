import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { useAppStateStore } from '@app/store/appStateStore';
import CriticalProblemDialog from './CriticalProblemDialog';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ listen: vi.fn(), onCloseRequested: vi.fn() })),
}));

const showProblem = (description: string) =>
    useAppStateStore.setState({
        criticalProblem: { title: 'common:wallet-settings-problem', description, error_message: 'detail' },
    });

describe('CriticalProblemDialog start fresh', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        vi.mocked(invoke).mockResolvedValue(undefined);
    });

    it('offers start fresh with its own label when the wallet config is missing', () => {
        showProblem('common:wallet-config-missing');
        render(<CriticalProblemDialog />);
        expect(screen.getByText('common:wallet-config-missing-start-fresh')).toBeInTheDocument();
        expect(screen.queryByText('common:wallet-config-start-fresh')).not.toBeInTheDocument();
    });

    it('keeps the existing label when the wallet config is unreadable', () => {
        showProblem('common:wallet-config-unreadable');
        render(<CriticalProblemDialog />);
        expect(screen.getByText('common:wallet-config-start-fresh')).toBeInTheDocument();
    });

    it('offers no start fresh for other problems', () => {
        showProblem('common:wallet-config-incomplete');
        render(<CriticalProblemDialog />);
        expect(screen.queryByText('common:wallet-config-start-fresh')).not.toBeInTheDocument();
        expect(screen.queryByText('common:wallet-config-missing-start-fresh')).not.toBeInTheDocument();
    });

    it('starts fresh in place and clears the problem without restarting', async () => {
        showProblem('common:wallet-config-missing');
        render(<CriticalProblemDialog />);
        fireEvent.click(screen.getByText('common:wallet-config-missing-start-fresh'));

        await waitFor(() => expect(useAppStateStore.getState().criticalProblem).toBeUndefined());
        expect(invoke).toHaveBeenCalledWith('discard_unreadable_wallet_config');
        expect(invoke).not.toHaveBeenCalledWith('restart_application');
    });

    it('keeps the dialog open and logs when start fresh fails', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        vi.mocked(invoke).mockRejectedValue('keyring locked');
        showProblem('common:wallet-config-unreadable');
        render(<CriticalProblemDialog />);
        fireEvent.click(screen.getByText('common:wallet-config-start-fresh'));

        await waitFor(() => expect(consoleError).toHaveBeenCalled());
        expect(useAppStateStore.getState().criticalProblem?.description).toBe('common:wallet-config-unreadable');
        expect(invoke).not.toHaveBeenCalledWith('restart_application');
        // The button comes back after the failure, so the user can retry.
        fireEvent.click(await screen.findByText('common:wallet-config-start-fresh'));
        await waitFor(() => expect(consoleError).toHaveBeenCalledTimes(2));
        expect(invoke).toHaveBeenCalledTimes(2);
        expect(invoke).toHaveBeenLastCalledWith('discard_unreadable_wallet_config');
        consoleError.mockRestore();
    });
});

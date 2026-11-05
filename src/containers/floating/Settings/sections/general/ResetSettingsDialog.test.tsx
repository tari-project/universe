import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { act, fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import ResetSettingsDialog from './ResetSettingsDialog';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
    Trans: () => null,
    initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

describe('ResetSettingsDialog', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset().mockResolvedValue(undefined);
    });

    it('test_reset_failed_invoke_keeps_dialog_open_and_offers_restart', async () => {
        let rejectReset!: (reason: string) => void;
        vi.mocked(invoke).mockImplementationOnce(
            () =>
                new Promise((_resolve, reject) => {
                    rejectReset = reject;
                })
        );
        const onOpenChange = vi.fn();
        render(<ResetSettingsDialog isOpen onOpenChange={onOpenChange} />);
        fireEvent.click(screen.getAllByRole('radio')[1]);
        fireEvent.click(screen.getByRole('button', { name: 'reset' }));

        await waitFor(() => expect(screen.getByRole('button', { name: 'reset' })).toBeDisabled());
        await act(async () => rejectReset('wallet.db sharing violation'));

        expect(await screen.findByRole('alert')).toHaveTextContent('wallet.db sharing violation');
        expect(invoke).toHaveBeenCalledWith('reset_settings', { resetWallet: true });
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(screen.getByTestId('settings-reset-dialog')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'reset' })).not.toBeInTheDocument();
        fireEvent.keyDown(screen.getByTestId('settings-reset-dialog'), { key: 'Escape' });
        expect(onOpenChange).not.toHaveBeenCalled();

        screen.getAllByRole('radio').forEach((radio) => expect(radio).toBeDisabled());
        const restartButton = screen.getByRole('button', { name: 'common:restart' });
        await waitFor(() => expect(restartButton).toBeEnabled());
        await waitFor(() => expect(restartButton).toHaveFocus());
        fireEvent.click(restartButton);
        await waitFor(() => expect(invoke).toHaveBeenCalledWith('restart_application'));
        expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('preserves the reset diagnostic when restarting fails and allows another restart', async () => {
        vi.mocked(invoke)
            .mockRejectedValueOnce('wallet.db sharing violation')
            .mockRejectedValueOnce('restart IPC failed');
        const onOpenChange = vi.fn();
        render(<ResetSettingsDialog isOpen onOpenChange={onOpenChange} />);
        fireEvent.click(screen.getAllByRole('radio')[1]);
        fireEvent.click(screen.getByRole('button', { name: 'reset' }));
        await screen.findByRole('alert');

        const restartButton = screen.getByRole('button', { name: 'common:restart' });
        await waitFor(() => expect(restartButton).toBeEnabled());
        fireEvent.click(restartButton);

        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('restart IPC failed'));
        expect(screen.getByRole('alert')).toHaveTextContent('wallet.db sharing violation');
        expect(onOpenChange).not.toHaveBeenCalled();
        await waitFor(() => expect(restartButton).toBeEnabled());
        fireEvent.click(restartButton);
        await waitFor(() => expect(invoke).toHaveBeenCalledTimes(3));
    });

    it.each([
        [0, false],
        [1, true],
    ])('submits reset mode %s and closes after the successful backend restart', async (index, resetWallet) => {
        const onOpenChange = vi.fn();
        render(<ResetSettingsDialog isOpen onOpenChange={onOpenChange} />);
        fireEvent.click(screen.getAllByRole('radio')[index]);
        fireEvent.click(screen.getByRole('button', { name: 'reset' }));

        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
        expect(invoke).toHaveBeenCalledExactlyOnceWith('reset_settings', { resetWallet });
    });
});

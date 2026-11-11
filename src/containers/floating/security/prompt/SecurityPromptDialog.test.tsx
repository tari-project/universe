import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { fireEvent, render, screen } from '@app/test/test-utils';
import { useSecurityStore } from '@app/store/useSecurityStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import SecurityPromptDialog from './SecurityPromptDialog';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

describe('SecurityPromptDialog PIN creation (#3518)', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        vi.mocked(invoke).mockResolvedValue(undefined as never);
        useSecurityStore.setState({ modal: 'intro' });
        useWalletStore.setState({ is_seed_backed_up: true });
    });

    it('starts PIN creation when the wallet is known to have no PIN', () => {
        useWalletStore.setState({ is_pin_locked: false });
        render(<SecurityPromptDialog />);

        fireEvent.click(screen.getByText('intro.button'));
        expect(invoke).toHaveBeenCalledWith('create_pin');
    });

    it('does not start PIN creation while the PIN state is unknown', () => {
        useWalletStore.setState({ is_pin_locked: undefined });
        render(<SecurityPromptDialog />);

        fireEvent.click(screen.getByText('intro.button'));
        expect(invoke).not.toHaveBeenCalledWith('create_pin');
    });

    it('does not start PIN creation when a PIN is already set', () => {
        useWalletStore.setState({ is_pin_locked: true });
        render(<SecurityPromptDialog />);

        fireEvent.click(screen.getByText('intro.button'));
        expect(invoke).not.toHaveBeenCalledWith('create_pin');
    });
});

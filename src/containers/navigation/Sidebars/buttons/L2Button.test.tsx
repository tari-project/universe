import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@app/test/test-utils';
import { useUIStore } from '@app/store/useUIStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { openL2 } from '@app/store/actions/l2OpenActions.ts';
import L2Button from './L2Button';

vi.mock('@app/store/actions/l2OpenActions.ts', () => ({ openL2: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

describe('L2Button', () => {
    beforeEach(() => {
        vi.mocked(openL2).mockReset();
        useUIStore.setState({ l2Open: false, showTapplet: false });
        useWalletStore.setState({ is_pin_locked: undefined });
    });

    it('is disabled with a busy indication while the PIN state is unknown', () => {
        render(<L2Button />);
        const button = screen.getByTestId('sidebar-l2-button');

        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-busy', 'true');
        fireEvent.click(button);
        expect(openL2).not.toHaveBeenCalled();
    });

    it.each([true, false])('becomes clickable once the PIN state is known (%s)', (isPinLocked) => {
        render(<L2Button />);
        const button = screen.getByTestId('sidebar-l2-button');
        expect(button).toBeDisabled();

        act(() => useWalletStore.setState({ is_pin_locked: isPinLocked }));

        expect(button).toBeEnabled();
        expect(button).toHaveAttribute('aria-busy', 'false');
        fireEvent.click(button);
        expect(openL2).toHaveBeenCalledOnce();
    });

    it('can still close an open panel while the PIN state is unknown', () => {
        useUIStore.setState({ l2Open: true });
        render(<L2Button />);
        const button = screen.getByTestId('sidebar-l2-button');

        expect(button).toBeEnabled();
        fireEvent.click(button);
        expect(useUIStore.getState().l2Open).toBe(false);
        expect(openL2).not.toHaveBeenCalled();
    });
});

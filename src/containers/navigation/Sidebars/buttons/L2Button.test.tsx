import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@app/test/test-utils';
import { useUIStore } from '@app/store/useUIStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { cancelOpenL2Wait, openL2 } from '@app/store/actions/l2OpenActions.ts';
import L2Button from './L2Button';

vi.mock('@app/store/actions/l2OpenActions.ts', () => ({ openL2: vi.fn(), cancelOpenL2Wait: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

describe('L2Button', () => {
    beforeEach(() => {
        vi.mocked(openL2).mockReset();
        vi.mocked(openL2).mockResolvedValue(undefined);
        vi.mocked(cancelOpenL2Wait).mockReset();
        useUIStore.setState({ l2Open: false, showTapplet: false });
        useWalletStore.setState({ is_pin_locked: undefined });
    });

    it('keeps the click while the PIN state is unknown and spins until it arrives', async () => {
        let resolveOpen: () => void = () => undefined;
        vi.mocked(openL2).mockImplementation(
            () =>
                new Promise<void>((resolve) => {
                    resolveOpen = resolve;
                })
        );
        render(<L2Button />);
        const button = screen.getByTestId('sidebar-l2-button');

        expect(button).toBeEnabled();
        expect(button).toHaveAttribute('title', 'l2.waiting-for-wallet');
        fireEvent.click(button);
        expect(openL2).toHaveBeenCalledOnce();

        expect(button).toHaveAttribute('aria-busy', 'true');
        expect(button).toHaveAttribute('title', 'l2.loading');

        await act(async () => {
            resolveOpen();
        });

        expect(button).toHaveAttribute('aria-busy', 'false');
    });

    it('cancels the wait when clicked again while spinning', async () => {
        vi.mocked(openL2).mockImplementation(() => new Promise<void>(() => undefined));
        render(<L2Button />);
        const button = screen.getByTestId('sidebar-l2-button');

        fireEvent.click(button);
        expect(button).toHaveAttribute('aria-busy', 'true');
        expect(button).toBeEnabled();

        fireEvent.click(button);
        expect(cancelOpenL2Wait).toHaveBeenCalledOnce();
        expect(openL2).toHaveBeenCalledOnce();
    });

    it.each([true, false])('opens L2 straight away once the PIN state is known (%s)', (isPinLocked) => {
        render(<L2Button />);
        const button = screen.getByTestId('sidebar-l2-button');
        expect(button).toBeEnabled();

        act(() => useWalletStore.setState({ is_pin_locked: isPinLocked }));

        expect(button).toBeEnabled();
        expect(button).toHaveAttribute('aria-busy', 'false');
        expect(button).toHaveAttribute('title', 'l2.title');
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
        expect(cancelOpenL2Wait).toHaveBeenCalledOnce();
        expect(openL2).not.toHaveBeenCalled();
    });

    it('explains the wait while the PIN state is unknown', () => {
        render(<L2Button />);
        const button = screen.getByTestId('sidebar-l2-button');

        expect(button).toBeEnabled();
        expect(button).toHaveAttribute('title', 'l2.waiting-for-wallet');
        expect(button).toHaveAttribute('data-pin-state-known', 'false');

        act(() => useWalletStore.setState({ is_pin_locked: true }));

        expect(button).toHaveAttribute('title', 'l2.title');
        expect(button).toHaveAttribute('data-pin-state-known', 'true');
    });
});

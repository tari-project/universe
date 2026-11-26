import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@app/test/test-utils';
import { useUIStore } from '@app/store/useUIStore.ts';
import MiningPageButton from './MiningPageButton';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

describe('MiningPageButton', () => {
    beforeEach(() => {
        useUIStore.setState({ miningPageOpen: false, sidebarOpen: false, l2Open: false, showTapplet: false });
    });

    it('opens the mining page and closes the other sidebar cards', () => {
        useUIStore.setState({ sidebarOpen: true, l2Open: true });
        render(<MiningPageButton />);
        const button = screen.getByTestId('sidebar-mining-page-button');

        fireEvent.click(button);

        const state = useUIStore.getState();
        expect(state.miningPageOpen).toBe(true);
        expect(state.sidebarOpen).toBe(false);
        expect(state.l2Open).toBe(false);
        expect(button).toHaveAttribute('data-active', 'true');
    });

    it('closes the mining page when clicked again', () => {
        useUIStore.setState({ miningPageOpen: true });
        render(<MiningPageButton />);
        const button = screen.getByTestId('sidebar-mining-page-button');

        fireEvent.click(button);

        expect(useUIStore.getState().miningPageOpen).toBe(false);
        expect(button).toHaveAttribute('data-active', 'false');
    });

    it('leaves a tapplet before opening the mining page', () => {
        useUIStore.setState({ showTapplet: true });
        render(<MiningPageButton />);

        fireEvent.click(screen.getByTestId('sidebar-mining-page-button'));

        const state = useUIStore.getState();
        expect(state.showTapplet).toBe(false);
        expect(state.miningPageOpen).toBe(true);
    });
});

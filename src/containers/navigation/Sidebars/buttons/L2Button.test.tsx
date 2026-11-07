import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@app/test/test-utils';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
import { AppModule, AppModuleStatus } from '@app/store/types/setup.ts';
import { openL2 } from '@app/store/actions/l2OpenActions.ts';
import L2Button from './L2Button';

vi.mock('@app/store/actions/l2OpenActions.ts', () => ({ openL2: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

const setWalletStatus = (status: AppModuleStatus) =>
    useSetupStore.setState((state) => ({
        app_modules: {
            ...state.app_modules,
            [AppModule.Wallet]: { ...state.app_modules[AppModule.Wallet], status },
        },
    }));

describe('L2Button', () => {
    beforeEach(() => {
        vi.mocked(openL2).mockReset();
        useUIStore.setState({ l2Open: false, showTapplet: false });
        useWalletStore.setState({ is_pin_locked: false, is_pin_state_loaded: false });
        setWalletStatus(AppModuleStatus.Initializing);
    });

    it.each(['wallet', 'pin'])('waits for both startup events when %s arrives first', (first) => {
        render(<L2Button />);
        const button = screen.getByTestId('sidebar-l2-button');
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-busy', 'true');
        fireEvent.click(button);
        expect(openL2).not.toHaveBeenCalled();

        const walletReady = () => setWalletStatus(AppModuleStatus.Initialized);
        const pinReady = () => useWalletStore.setState({ is_pin_locked: true, is_pin_state_loaded: true });
        act(first === 'wallet' ? walletReady : pinReady);
        expect(button).toBeDisabled();
        act(first === 'wallet' ? pinReady : walletReady);
        expect(button).toBeEnabled();
        expect(button).toHaveAttribute('aria-busy', 'false');
        fireEvent.click(button);
        expect(openL2).toHaveBeenCalledOnce();
    });

    it('can still close an open panel while the wallet restarts', () => {
        useUIStore.setState({ l2Open: true });
        render(<L2Button />);
        fireEvent.click(screen.getByTestId('sidebar-l2-button'));
        expect(useUIStore.getState().l2Open).toBe(false);
        expect(openL2).not.toHaveBeenCalled();
    });
});

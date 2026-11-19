import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@app/test/test-utils';
import { useUIStore } from '@app/store/useUIStore.ts';
import { initialState as initialWalletState, useWalletStore } from '@app/store/useWalletStore.ts';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { AppModule, AppModuleStatus } from '@app/store/types/setup.ts';
import BuyButton from './BuyButton';
import MineButton from './MineButton';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));
vi.mock('@tari-project/tari-tower', () => ({
    loadTowerAnimation: vi.fn(),
    removeTowerAnimation: vi.fn(),
    setAnimationProperties: vi.fn(),
    setAnimationState: vi.fn(),
}));

const setWalletModuleStatus = (status: AppModuleStatus) => {
    useSetupStore.setState((state) => ({
        app_modules: {
            ...state.app_modules,
            [AppModule.Wallet]: {
                ...state.app_modules[AppModule.Wallet],
                status,
            },
        },
    }));
};

describe('BuyButton', () => {
    beforeEach(() => {
        useWalletStore.setState({ ...initialWalletState, is_swapping: false });
        useUIStore.setState({ sidebarOpen: true, l2Open: true, showTapplet: true });
        setWalletModuleStatus(AppModuleStatus.Initialized);
    });

    it('opens the Buy page and closes sidebars and tapplet on click, and toggles closed on second click', () => {
        render(<BuyButton />);

        const button = screen.getByTestId('sidebar-buy-button');
        expect(button).toHaveAttribute('aria-label', 'swap.buy-tari');
        expect(button).toHaveAttribute('data-active', 'false');

        fireEvent.click(button);

        expect(useWalletStore.getState().is_swapping).toBe(true);
        expect(useUIStore.getState().sidebarOpen).toBe(false);
        expect(useUIStore.getState().l2Open).toBe(false);
        expect(useUIStore.getState().showTapplet).toBe(false);
        expect(button).toHaveAttribute('data-active', 'true');

        fireEvent.click(button);
        expect(useWalletStore.getState().is_swapping).toBe(false);
        expect(button).toHaveAttribute('data-active', 'false');
    });

    it('is disabled when the wallet module has failed', () => {
        setWalletModuleStatus(AppModuleStatus.Failed);

        render(<BuyButton />);

        expect(screen.getByTestId('sidebar-buy-button')).toBeDisabled();
    });

    it('exits the Buy page and reopens the main sidebar when MineButton is clicked', () => {
        useWalletStore.setState({ ...initialWalletState, is_swapping: true });
        useUIStore.setState({ sidebarOpen: false, showTapplet: false });

        render(<MineButton />);

        fireEvent.click(screen.getByTestId('sidebar-mine-button'));

        expect(useWalletStore.getState().is_swapping).toBe(false);
        expect(useUIStore.getState().sidebarOpen).toBe(true);
    });
});

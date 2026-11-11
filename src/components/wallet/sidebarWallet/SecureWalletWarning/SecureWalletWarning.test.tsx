import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@app/test/test-utils';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useSetupStore } from '@app/store/useSetupStore';
import { AppModule, AppModuleStatus } from '@app/store/types/setup.ts';
import SecureWalletWarning from './SecureWalletWarning';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

describe('SecureWalletWarning (#3518)', () => {
    beforeEach(() => {
        useSetupStore.setState((state) => ({
            app_modules: {
                ...state.app_modules,
                [AppModule.Wallet]: { ...state.app_modules[AppModule.Wallet], status: AppModuleStatus.Initialized },
            },
        }));
        useWalletStore.setState({ is_seed_backed_up: true });
    });

    it('renders nothing while the PIN state is unknown', () => {
        useWalletStore.setState({ is_pin_locked: undefined });
        const { container } = render(<SecureWalletWarning $isScrolled={false} isExchangeMiner={true} />);
        expect(container.firstChild).toBeNull();
    });

    it('shows the warning when the wallet is known to have no PIN', () => {
        useWalletStore.setState({ is_pin_locked: false });
        const { container } = render(<SecureWalletWarning $isScrolled={false} isExchangeMiner={true} />);
        expect(container.firstChild).not.toBeNull();
    });

    it('hides the warning when a PIN is set', () => {
        useWalletStore.setState({ is_pin_locked: true });
        const { container } = render(<SecureWalletWarning $isScrolled={false} isExchangeMiner={true} />);
        expect(container.firstChild).toBeNull();
    });
});

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@app/test/test-utils';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { PinMarkup } from './PinMarkup';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

describe('PinMarkup (#3518)', () => {
    it('offers PIN setup when the wallet is known to have no PIN', () => {
        useWalletStore.setState({ is_pin_locked: false });
        render(<PinMarkup />);
        expect(screen.getByTestId('wallet-setup-pin')).toBeInTheDocument();
    });

    it('renders nothing while the PIN state is unknown', () => {
        useWalletStore.setState({ is_pin_locked: undefined });
        const { container } = render(<PinMarkup />);
        expect(screen.queryByTestId('wallet-setup-pin')).not.toBeInTheDocument();
        expect(container.firstChild).toBeNull();
    });

    it('renders nothing when a PIN is already set', () => {
        useWalletStore.setState({ is_pin_locked: true });
        const { container } = render(<PinMarkup />);
        expect(container.firstChild).toBeNull();
    });
});

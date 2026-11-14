/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { WalletConnectDialog } from './WalletConnectDialog';

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({ writeText: vi.fn(), readText: vi.fn(), clear: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

// jsdom has no canvas implementation; capture the value the QR would encode instead.
const qrValues: string[] = [];
vi.mock('react-qrcode-logo', () => ({
    QRCode: ({ value }: { value: string }) => {
        qrValues.push(value);
        return <canvas data-testid="qr-canvas" />;
    },
}));

const WC_URI = 'wc:abc123@2?relay-protocol=irn&symKey=deadbeef';

describe('WalletConnectDialog', () => {
    beforeEach(() => {
        vi.mocked(writeText).mockReset();
        vi.mocked(writeText).mockResolvedValue(undefined as never);
        qrValues.length = 0;
    });

    it('renders the pairing URI as a QR code', () => {
        render(<WalletConnectDialog isOpen setIsOpen={vi.fn()} uri={WC_URI} />);

        expect(screen.getByTestId('walletconnect-qr')).toBeTruthy();
        expect(qrValues).toContain(WC_URI);
    });

    it('copies the pairing URI when the copy button is clicked', async () => {
        render(<WalletConnectDialog isOpen setIsOpen={vi.fn()} uri={WC_URI} />);

        fireEvent.click(screen.getByText('swap.copy-link'));

        await waitFor(() => expect(writeText).toHaveBeenCalledWith(WC_URI));
    });

    it('shows the fallback text when no wc: URI is provided', () => {
        render(<WalletConnectDialog isOpen setIsOpen={vi.fn()} uri={null} />);

        expect(screen.queryByTestId('walletconnect-qr')).toBeNull();
        expect(screen.getByText('swap.connect-not-supported')).toBeTruthy();
    });

    it('rejects a non-wc URI instead of encoding it', () => {
        render(<WalletConnectDialog isOpen setIsOpen={vi.fn()} uri="https://example.com" />);

        expect(qrValues).not.toContain('https://example.com');
        expect(screen.getByText('swap.connect-not-supported')).toBeTruthy();
    });
});

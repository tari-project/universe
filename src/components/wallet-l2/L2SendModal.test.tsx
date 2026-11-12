/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import L2SendModal from './L2SendModal';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

const GOOD = 'otl_esm_good';

describe('L2SendModal', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        vi.mocked(invoke).mockImplementation((async (cmd: string, args?: { address?: string }) => {
            if (cmd === 'l2_validate_address' && args?.address !== GOOD) throw 'Invalid L2 address';
        }) as typeof invoke);
    });

    async function fill(address: string, amount: string) {
        render(<L2SendModal show account="component_test" onClose={vi.fn()} />);
        const [addressInput, amountInput] = await screen.findAllByRole('textbox');
        fireEvent.change(addressInput, { target: { value: address } });
        fireEvent.change(amountInput, { target: { value: amount } });
        await waitFor(() => expect(invoke).toHaveBeenCalledWith('l2_validate_address', { address }));
    }

    it('keeps review disabled for an address the backend rejects', async () => {
        await fill('otl_esm_typo', '1');
        await screen.findByText('l2.send.error-invalid-address');
        expect(screen.getByTestId('l2-send-review-button')).toBeDisabled();
        expect(invoke).not.toHaveBeenCalledWith('l2_send', expect.anything());
    });

    it('allows review once the address is valid and the amount is above zero', async () => {
        await fill(GOOD, '1');
        await waitFor(() => expect(screen.getByTestId('l2-send-review-button')).toBeEnabled());
    });

    it('test_l2_send_review_displays_tari', async () => {
        await fill(GOOD, '1');
        await waitFor(() => expect(screen.getByTestId('l2-send-review-button')).toBeEnabled());
        fireEvent.click(screen.getByTestId('l2-send-review-button'));
        expect(await screen.findByText('TARI')).toBeInTheDocument();
    });

    it('tells the user the send was cancelled when the PIN prompt is dismissed', async () => {
        vi.mocked(invoke).mockImplementation((async (cmd: string) => {
            if (cmd === 'l2_send') throw 'PIN entry cancelled';
        }) as typeof invoke);
        await fill(GOOD, '1');
        await waitFor(() => expect(screen.getByTestId('l2-send-review-button')).toBeEnabled());
        fireEvent.click(screen.getByTestId('l2-send-review-button'));
        fireEvent.click(await screen.findByTestId('l2-send-confirm-button'));

        expect(await screen.findByTestId('form-root-error')).toHaveTextContent('send.error-denied');
        expect(screen.getByTestId('l2-send-review-button')).toBeInTheDocument();
    });

    it('defaults to private visibility and sends visibility="private"', async () => {
        vi.mocked(invoke).mockImplementation((async (cmd: string, args?: { address?: string }) => {
            if (cmd === 'l2_validate_address' && args?.address !== GOOD) throw 'Invalid L2 address';
            if (cmd === 'l2_send') return 'tx_private_1';
        }) as typeof invoke);

        await fill(GOOD, '2.5');
        expect(screen.getByTestId('l2-send-visibility-private')).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByTestId('l2-send-visibility-public')).toHaveAttribute('aria-pressed', 'false');
        expect(screen.queryByTestId('l2-send-public-note')).not.toBeInTheDocument();

        await waitFor(() => expect(screen.getByTestId('l2-send-review-button')).toBeEnabled());
        fireEvent.click(screen.getByTestId('l2-send-review-button'));

        const confirmButton = await screen.findByTestId('l2-send-confirm-button');
        expect(screen.getByText('l2.send.visibility')).toBeInTheDocument();
        expect(screen.getByText('l2.send.visibility-private')).toBeInTheDocument();

        fireEvent.click(confirmButton);
        await waitFor(() =>
            expect(invoke).toHaveBeenCalledWith('l2_send', {
                account: 'component_test',
                destination: GOOD,
                amount: '2.5',
                visibility: 'private',
            })
        );
    });

    it('shows the public note and sends visibility="public" when switched to Public', async () => {
        vi.mocked(invoke).mockImplementation((async (cmd: string, args?: { address?: string }) => {
            if (cmd === 'l2_validate_address' && args?.address !== GOOD) throw 'Invalid L2 address';
            if (cmd === 'l2_send') return 'tx_public_1';
        }) as typeof invoke);

        await fill(GOOD, '3');
        fireEvent.click(screen.getByTestId('l2-send-visibility-public'));
        expect(screen.getByTestId('l2-send-visibility-public')).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByTestId('l2-send-public-note')).toHaveTextContent('l2.send.public-note');

        await waitFor(() => expect(screen.getByTestId('l2-send-review-button')).toBeEnabled());
        fireEvent.click(screen.getByTestId('l2-send-review-button'));

        const confirmButton = await screen.findByTestId('l2-send-confirm-button');
        expect(screen.getByText('l2.send.visibility-public')).toBeInTheDocument();

        fireEvent.click(confirmButton);
        await waitFor(() =>
            expect(invoke).toHaveBeenCalledWith('l2_send', {
                account: 'component_test',
                destination: GOOD,
                amount: '3',
                visibility: 'public',
            })
        );
    });
});

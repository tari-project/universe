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
});

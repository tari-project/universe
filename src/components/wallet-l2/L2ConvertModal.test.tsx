/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import type { L2Conversion } from '@app/types/events-payloads.ts';
import L2ConvertModal from './L2ConvertModal';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

const ACCOUNT = 'component_test';
const ADDRESS = 'otl_esm_own';
const AVAILABLE = 2_000_000;

function renderModal(conversion: L2Conversion, available = AVAILABLE) {
    const onClose = vi.fn();
    render(
        <L2ConvertModal
            conversion={conversion}
            account={ACCOUNT}
            address={ADDRESS}
            available={available}
            onClose={onClose}
        />
    );
    return onClose;
}

const amountInput = async () => (await screen.findAllByRole('textbox'))[0];

async function review(amount: string) {
    fireEvent.change(await amountInput(), { target: { value: amount } });
    await waitFor(() => expect(screen.getByTestId('l2-convert-review-button')).toBeEnabled());
    fireEvent.click(screen.getByTestId('l2-convert-review-button'));
}

describe('L2ConvertModal', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
    });

    it.each([
        ['shield', 'l2_shield', 'l2.shield.review-label'],
        ['unshield', 'l2_unshield', 'l2.unshield.review-label'],
    ] as const)('reviews a %s, then asks %s for exactly that amount', async (conversion, command, label) => {
        vi.mocked(invoke).mockResolvedValue('tx_id');
        renderModal(conversion);
        await review('1.5');

        expect(await screen.findByText(label)).toBeInTheDocument();
        expect(screen.getByText(ADDRESS)).toBeInTheDocument();
        expect(screen.getByText('1.500000')).toBeInTheDocument();
        expect(invoke).not.toHaveBeenCalled();

        fireEvent.click(screen.getByTestId('l2-convert-confirm-button'));
        await waitFor(() => expect(invoke).toHaveBeenCalledWith(command, { account: ACCOUNT, amount: '1.5' }));
        expect(await screen.findByText('tx_id')).toBeInTheDocument();
    });

    it('keeps review disabled for more than the balance being converted', async () => {
        renderModal('shield');
        const input = await amountInput();
        fireEvent.change(input, { target: { value: '2.000001' } });
        fireEvent.blur(input);

        expect(await screen.findByText('l2.convert.error-over-balance')).toBeInTheDocument();
        expect(screen.getByTestId('l2-convert-review-button')).toBeDisabled();
    });

    it('fills Max with what the backend says is left after the fee', async () => {
        vi.mocked(invoke).mockResolvedValue(1_997_500);
        renderModal('unshield');
        fireEvent.click(await screen.findByTestId('l2-convert-max-button'));

        await waitFor(() => expect(screen.getByDisplayValue('1.9975')).toBeInTheDocument());
        expect(invoke).toHaveBeenCalledWith('l2_max_conversion', { account: ACCOUNT, conversion: 'unshield' });
        await waitFor(() => expect(screen.getByTestId('l2-convert-review-button')).toBeEnabled());
    });

    it('says so when Max cannot be worked out', async () => {
        vi.mocked(invoke).mockRejectedValue('A transaction is in progress. Try again once it has finished.');
        renderModal('shield');
        fireEvent.click(await screen.findByTestId('l2-convert-max-button'));

        expect(await screen.findByText('send.error-max-unavailable')).toBeInTheDocument();
    });

    it('offers no Max on an empty balance', async () => {
        renderModal('shield', 0);
        expect(await screen.findByTestId('l2-convert-max-button')).toBeDisabled();
    });

    it('tells the user it was cancelled when the PIN prompt is dismissed', async () => {
        vi.mocked(invoke).mockRejectedValue('PIN entry cancelled');
        renderModal('shield');
        await review('1');
        fireEvent.click(await screen.findByTestId('l2-convert-confirm-button'));

        expect(await screen.findByTestId('form-root-error')).toHaveTextContent('send.error-denied');
        expect(screen.getByTestId('l2-convert-review-button')).toBeInTheDocument();
    });

    it('shows the backend error when the conversion fails', async () => {
        vi.mocked(invoke).mockRejectedValue('L2 shield failed: RevealedOnly: Not enough revealed funds to spend.');
        renderModal('shield');
        await review('1');
        fireEvent.click(await screen.findByTestId('l2-convert-confirm-button'));

        expect(await screen.findByTestId('form-root-error')).toHaveTextContent(
            'l2.shield.error-messageL2 shield failed: RevealedOnly: Not enough revealed funds to spend.'
        );
    });
});

/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, type Mock } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { render, screen, fireEvent } from '@app/test/test-utils';
import BurnModal from './BurnModal';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

const CLAIM_KEY = 'ab'.repeat(32);

async function burnWith(result: (command: string) => Promise<unknown>) {
    const invokeMock = vi.mocked(invoke) as unknown as Mock<(command: string) => Promise<unknown>>;
    invokeMock.mockImplementation(result);
    render(<BurnModal section="burn" setSection={vi.fn()} claimPublicKey={CLAIM_KEY} />);

    // The modal renders in a portal, outside the render container.
    const amount = (await vi.waitFor(() => {
        const input = document.querySelector('input[name="amount"]');
        expect(input).not.toBeNull();
        return input;
    })) as HTMLInputElement;
    fireEvent.change(amount, { target: { value: '2' } });
    fireEvent.blur(amount);
    const review = await screen.findByTestId('burn-review-button');
    await vi.waitFor(() => expect(review).not.toBeDisabled());
    fireEvent.click(review);
    fireEvent.click(await screen.findByTestId('burn-confirm-button'));
    return invokeMock;
}

describe('BurnModal', () => {
    it('tells the user when the node has not accepted the burn yet', async () => {
        const invokeMock = await burnWith(async (command) =>
            command === 'burn_to_l2'
                ? { tx_id: '12', output_hash: 'aa', proof_file: 'proof.json', accepted_by_node: false }
                : []
        );

        expect(await screen.findByTestId('burn-not-accepted')).toHaveTextContent('send.not-accepted-yet');
        invokeMock.mockResolvedValue([]);
    });

    it('classifies a failed burn by its error code, not its text', async () => {
        const invokeMock = await burnWith(async (command) => {
            if (command === 'burn_to_l2') {
                throw '[wallet_error] Burn failed: denied by user; not enough funds for a change output';
            }
            return [];
        });

        const error = await screen.findByTestId('form-root-error');
        expect(error).toHaveTextContent('burn.error-message');
        expect(error).not.toHaveTextContent('send.error-denied');
        invokeMock.mockResolvedValue([]);
    });

    it('explains a burn that leaves no room for its change output', async () => {
        const invokeMock = await burnWith(async (command) => {
            if (command === 'burn_to_l2') {
                throw '[change_not_affordable] Burn failed: Not enough funds for a change output';
            }
            return [];
        });

        expect(await screen.findByTestId('form-root-error')).toHaveTextContent('send.error-change-not-affordable');
        invokeMock.mockResolvedValue([]);
    });
});

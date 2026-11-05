/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';
import { save } from '@tauri-apps/plugin-dialog';
import { render, screen, fireEvent } from '@app/test/test-utils';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { FEATURE_FLAGS } from '@app/store/consts.ts';
import { Network } from '@app/utils/network.ts';
import BurnModal from './BurnModal';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));
vi.mock('@tauri-apps/plugin-shell', () => ({ open: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@tauri-apps/plugin-dialog', () => ({ save: vi.fn() }));

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
    beforeEach(() => {
        useMiningStore.setState({ network: undefined });
        useAirdropStore.setState({ features: undefined });
        vi.mocked(save).mockReset();
    });

    it('offers a backup copy of the proof and keeps the source path out of the save dialog', async () => {
        vi.mocked(save).mockResolvedValue('/backup/proof.json');
        const invokeMock = await burnWith(async (command) =>
            command === 'burn_to_l2'
                ? { tx_id: '12', output_hash: 'aa', proof_file: '/app/burn_proofs/proof.json', accepted_by_node: true }
                : command === 'burn_proof_ready'
                  ? true
                  : undefined
        );
        fireEvent.click(await screen.findByTestId('burn-save-proof-button'));
        await vi.waitFor(() =>
            expect(invokeMock).toHaveBeenCalledWith('save_burn_proof', {
                proofFile: '/app/burn_proofs/proof.json',
                destination: '/backup/proof.json',
            })
        );
        expect(save).toHaveBeenCalledWith(expect.objectContaining({ defaultPath: 'proof.json' }));
    });

    it('waits until mining creates the proof before opening the save dialog', async () => {
        const invokeMock = await burnWith(async (command) =>
            command === 'burn_to_l2'
                ? { tx_id: '12', output_hash: 'aa', proof_file: 'proof.json', accepted_by_node: true }
                : command === 'burn_proof_ready'
                  ? false
                  : undefined
        );
        fireEvent.click(await screen.findByTestId('burn-save-proof-button'));
        await vi.waitFor(() =>
            expect(invokeMock).toHaveBeenCalledWith('burn_proof_ready', { proofFile: 'proof.json' })
        );
        expect(save).not.toHaveBeenCalled();
    });

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

    describe('pre-burn notice and share text', () => {
        const LIVE = [FEATURE_FLAGS.FF_OOTLE_MAINNET_LIVE as string];
        const accepted = async (command: string) =>
            command === 'burn_to_l2'
                ? { tx_id: '12', output_hash: 'aa', proof_file: 'proof.json', accepted_by_node: true }
                : [];
        const sharedText = async () => {
            fireEvent.click(await screen.findByTestId('burn-share-button'));
            const url = vi.mocked(open).mock.lastCall?.[0] ?? '';
            return decodeURIComponent(url.split('text=')[1]);
        };

        it.each([
            ['MainNet before the flag loads', Network.MainNet, undefined, true],
            ['MainNet without the live flag', Network.MainNet, ['polling'], true],
            ['MainNet with the live flag', Network.MainNet, LIVE, false],
            ['Esmeralda without the live flag', Network.Esmeralda, undefined, false],
        ])('ties the pre-burn notice to the launch flag on %s', async (_, network, features, preBurn) => {
            useMiningStore.setState({ network });
            useAirdropStore.setState({ features });
            render(<BurnModal section="burn" setSection={vi.fn()} claimPublicKey={CLAIM_KEY} />);

            await screen.findByTestId('burn-review-button');
            if (preBurn) {
                expect(screen.getByTestId('burn-pre-burn-notice')).toBeInTheDocument();
            } else {
                expect(screen.queryByTestId('burn-pre-burn-notice')).not.toBeInTheDocument();
            }
        });

        it('shares the pre-burn text on MainNet without the live flag', async () => {
            useMiningStore.setState({ network: Network.MainNet });
            const invokeMock = await burnWith(accepted);

            expect(await sharedText()).toContain('burn.share-text-pre');
            invokeMock.mockResolvedValue([]);
        });

        it('shares the normal text once the live flag is on', async () => {
            useMiningStore.setState({ network: Network.MainNet });
            useAirdropStore.setState({ features: LIVE });
            const invokeMock = await burnWith(accepted);

            const text = await sharedText();
            expect(text).toContain('burn.share-text');
            expect(text).not.toContain('burn.share-text-pre');
            invokeMock.mockResolvedValue([]);
        });
    });
});

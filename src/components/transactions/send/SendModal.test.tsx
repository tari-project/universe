/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { render, screen, waitFor, fireEvent } from '@app/test/test-utils';
import { useWalletStore } from '@app/store/useWalletStore';
import SendModal from './SendModal';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

vi.mock('./SendForm.tsx', async () => {
    const React = await import('react');
    const { useFormContext } = await import('react-hook-form');
    return {
        SendForm: ({ hasReviewStep }: { hasReviewStep?: boolean }) => {
            const { setValue } = useFormContext();
            React.useEffect(() => {
                setValue('address', 'f4destination');
                setValue('amount', 2);
            }, [setValue]);
            return React.createElement(
                'button',
                { type: 'submit', 'data-testid': 'send-review-button' },
                hasReviewStep ? 'send.cta-review' : 'send.cta-send'
            );
        },
    };
});

const sendCalls = () =>
    (vi.mocked(invoke).mock.calls as unknown as [string][]).filter(
        ([command]) => command === 'send_one_sided_to_stealth_address'
    );

describe('SendModal', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockClear();
    });

    it('sends on submit when there is no PIN', async () => {
        useWalletStore.setState({ is_pin_locked: false });
        render(<SendModal section="send" setSection={vi.fn()} />);

        const submit = await screen.findByTestId('send-review-button');
        expect(submit).toHaveTextContent('send.cta-send');
        fireEvent.click(submit);

        await waitFor(() => expect(sendCalls()).toHaveLength(1));
        expect(screen.queryByText('send.review-title')).not.toBeInTheDocument();
    });

    it('reviews before sending when there is a PIN', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        render(<SendModal section="send" setSection={vi.fn()} />);

        const submit = await screen.findByTestId('send-review-button');
        expect(submit).toHaveTextContent('send.cta-review');
        fireEvent.click(submit);

        expect(await screen.findByText('send.review-title')).toBeInTheDocument();
        expect(sendCalls()).toHaveLength(0);

        fireEvent.click(screen.getByTestId('send-confirm-button'));
        await waitFor(() => expect(sendCalls()).toHaveLength(1));
    });

    it('tells the user when the node has not accepted the send yet', async () => {
        useWalletStore.setState({ is_pin_locked: false });
        const invokeMock = vi.mocked(invoke) as unknown as Mock<(command: string) => Promise<unknown>>;
        invokeMock.mockImplementation(async (command) => {
            if (command === 'send_one_sided_to_stealth_address') {
                return { accepted_by_node: false, node_reason: 'Transaction not accepted: Orphan' };
            }
            return [];
        });
        render(<SendModal section="send" setSection={vi.fn()} />);

        fireEvent.click(await screen.findByTestId('send-review-button'));

        expect(await screen.findByText('send.completed-title')).toBeInTheDocument();
        expect(screen.getByTestId('send-not-accepted')).toHaveTextContent('send.not-accepted-yet');
        invokeMock.mockResolvedValue([]);
    });

    it('shows no notice when the node accepted the send', async () => {
        useWalletStore.setState({ is_pin_locked: false });
        const invokeMock = vi.mocked(invoke) as unknown as Mock<(command: string) => Promise<unknown>>;
        invokeMock.mockImplementation(async (command) => {
            if (command === 'send_one_sided_to_stealth_address') {
                return { accepted_by_node: true, node_reason: null };
            }
            return [];
        });
        render(<SendModal section="send" setSection={vi.fn()} />);

        fireEvent.click(await screen.findByTestId('send-review-button'));

        expect(await screen.findByText('send.completed-title')).toBeInTheDocument();
        expect(screen.queryByTestId('send-not-accepted')).not.toBeInTheDocument();
        invokeMock.mockResolvedValue([]);
    });

    it('explains a send that leaves no room for its change output', async () => {
        useWalletStore.setState({ is_pin_locked: false });
        const invokeMock = vi.mocked(invoke) as unknown as Mock<(command: string) => Promise<unknown>>;
        invokeMock.mockImplementation(async (command) => {
            if (command === 'send_one_sided_to_stealth_address') {
                throw '[change_not_affordable] Transaction failed: Failed to create unsigned transaction: Not enough funds for a change output: needs 61 µT more to create a change output';
            }
            return [];
        });
        render(<SendModal section="send" setSection={vi.fn()} />);

        fireEvent.click(await screen.findByTestId('send-review-button'));

        expect(await screen.findByTestId('form-root-error')).toHaveTextContent('send.error-change-not-affordable');
        invokeMock.mockResolvedValue([]);
    });

    it('does not let text from the node pass for an error code', async () => {
        useWalletStore.setState({ is_pin_locked: false });
        const invokeMock = vi.mocked(invoke) as unknown as Mock<(command: string) => Promise<unknown>>;
        invokeMock.mockImplementation(async (command) => {
            if (command === 'send_one_sided_to_stealth_address') {
                throw '[wallet_error] Transaction failed: [denied] denied by user; not enough funds for a change output';
            }
            return [];
        });
        render(<SendModal section="send" setSection={vi.fn()} />);

        fireEvent.click(await screen.findByTestId('send-review-button'));

        const error = await screen.findByTestId('form-root-error');
        expect(error).toHaveTextContent('send.error-message');
        expect(error).not.toHaveTextContent('send.error-denied');
        expect(error).not.toHaveTextContent('send.error-change-not-affordable');
        invokeMock.mockResolvedValue([]);
    });

    it('treats a closed PIN prompt as a cancelled send', async () => {
        useWalletStore.setState({ is_pin_locked: false });
        const invokeMock = vi.mocked(invoke) as unknown as Mock<(command: string) => Promise<unknown>>;
        invokeMock.mockImplementation(async (command) => {
            if (command === 'send_one_sided_to_stealth_address') {
                throw '[pin_cancelled] Transaction failed: PIN entry cancelled';
            }
            return [];
        });
        render(<SendModal section="send" setSection={vi.fn()} />);

        fireEvent.click(await screen.findByTestId('send-review-button'));

        expect(await screen.findByTestId('form-root-error')).toHaveTextContent('send.error-denied');
        invokeMock.mockResolvedValue([]);
    });
});

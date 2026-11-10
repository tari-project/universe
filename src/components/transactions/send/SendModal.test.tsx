/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { render, screen, waitFor, fireEvent } from '@app/test/test-utils';
import { useWalletStore } from '@app/store/useWalletStore';
import { FormProvider, useForm } from 'react-hook-form';
import SendModal from './SendModal';
import { FormField, MAX_PAYMENT_ID_BYTES, truncateToUtf8Bytes } from './FormField.tsx';
import { SendInputs } from './types.ts';

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
        vi.mocked(invoke).mockReset();
        vi.mocked(invoke).mockImplementation((async (cmd: string) => {
            if (cmd === 'effective_l1_payment_id') {
                return { payment_id: null, payment_id_overridden: false };
            }
        }) as typeof invoke);
    });

    it('does not take the no-PIN send path while the PIN flag is unknown', async () => {
        useWalletStore.setState({ is_pin_locked: undefined });
        render(<SendModal section="send" setSection={vi.fn()} />);

        const submit = await screen.findByTestId('send-review-button');
        expect(submit).toHaveTextContent('send.cta-review');
        fireEvent.click(submit);

        expect(await screen.findByText('send.review-title')).toBeInTheDocument();
        expect(sendCalls()).toHaveLength(0);
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
                return { accepted_by_node: false };
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
                return { accepted_by_node: true };
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

    it('estimates and displays the network fee on the review screen', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        vi.mocked(invoke).mockImplementation((async (cmd: string) => {
            if (cmd === 'estimate_l1_send_fee') return 1_250;
            if (cmd === 'effective_l1_payment_id') {
                return { payment_id: null, payment_id_overridden: false };
            }
        }) as typeof invoke);

        render(<SendModal section="send" setSection={vi.fn()} />);
        fireEvent.click(await screen.findByTestId('send-review-button'));

        expect(await screen.findByText('send.review-title')).toBeInTheDocument();
        expect(invoke).toHaveBeenCalledWith('estimate_l1_send_fee', {
            destination: 'f4destination',
            amount: '2',
            paymentId: undefined,
        });
        expect(screen.getByText('send.network-fee')).toBeInTheDocument();
        expect(screen.getByText('0.001250 XTM')).toBeInTheDocument();
        expect(screen.queryByTestId('payment-id-overridden')).not.toBeInTheDocument();
    });

    it('shows the address payment id on review when it replaces the message', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        vi.mocked(invoke).mockImplementation((async (cmd: string) => {
            if (cmd === 'estimate_l1_send_fee') return 1_250;
            if (cmd === 'effective_l1_payment_id') {
                return { payment_id: 'embedded-id', payment_id_overridden: true };
            }
        }) as typeof invoke);

        render(<SendModal section="send" setSection={vi.fn()} />);
        fireEvent.click(await screen.findByTestId('send-review-button'));

        expect(await screen.findByText('embedded-id')).toBeInTheDocument();
        expect(screen.getByTestId('payment-id-overridden')).toHaveTextContent('send.payment-id-overridden');
        expect(invoke).toHaveBeenCalledWith('effective_l1_payment_id', {
            destination: 'f4destination',
            paymentId: undefined,
        });
    });

    it('shows the address payment id after sending without a PIN', async () => {
        useWalletStore.setState({ is_pin_locked: false });
        const invokeMock = vi.mocked(invoke) as unknown as Mock<(command: string) => Promise<unknown>>;
        invokeMock.mockImplementation(async (command) => {
            if (command === 'effective_l1_payment_id') {
                return { payment_id: 'embedded-id', payment_id_overridden: true };
            }
            if (command === 'send_one_sided_to_stealth_address') {
                return { accepted_by_node: true };
            }
        });
        render(<SendModal section="send" setSection={vi.fn()} />);

        fireEvent.click(await screen.findByTestId('send-review-button'));

        expect(await screen.findByText('send.completed-title')).toBeInTheDocument();
        expect(screen.getByText('embedded-id')).toBeInTheDocument();
        expect(invoke).toHaveBeenCalledWith('effective_l1_payment_id', {
            destination: 'f4destination',
            paymentId: undefined,
        });
        invokeMock.mockResolvedValue([]);
    });

    it('stays on the form when fee estimation fails', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        vi.mocked(invoke).mockImplementation((async (cmd: string) => {
            if (cmd === 'estimate_l1_send_fee') {
                throw new Error('Insufficient funds to cover transaction fee');
            }
        }) as typeof invoke);

        render(<SendModal section="send" setSection={vi.fn()} />);
        fireEvent.click(await screen.findByTestId('send-review-button'));

        await waitFor(() =>
            expect(invoke).toHaveBeenCalledWith('estimate_l1_send_fee', {
                destination: 'f4destination',
                amount: '2',
                paymentId: undefined,
            })
        );
        expect(screen.queryByText('send.review-title')).not.toBeInTheDocument();
        expect(sendCalls()).toHaveLength(0);
    });

    it('ignores stale fee estimation results that resolve after the modal is closed', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        let resolveEstimate!: (value: number) => void;
        vi.mocked(invoke).mockImplementation(((cmd: string) => {
            if (cmd === 'estimate_l1_send_fee') {
                return new Promise<number>((resolve) => {
                    resolveEstimate = resolve;
                });
            }
            return Promise.resolve();
        }) as typeof invoke);

        const { rerender } = render(<SendModal section="send" setSection={vi.fn()} />);
        fireEvent.click(await screen.findByTestId('send-review-button'));

        await waitFor(() => expect(invoke).toHaveBeenCalledWith('estimate_l1_send_fee', expect.anything()));

        // Close the modal before the estimate resolves, then reopen it
        rerender(<SendModal section="history" setSection={vi.fn()} />);
        resolveEstimate(1_250);
        rerender(<SendModal section="send" setSection={vi.fn()} />);

        await waitFor(() => expect(screen.getByTestId('send-review-button')).toBeInTheDocument());
        expect(screen.queryByText('send.review-title')).not.toBeInTheDocument();
    });
});

describe('FormField payment ID byte limit', () => {
    function MessageFormHarness({ onValue }: { onValue: (val: string) => void }) {
        const methods = useForm<SendInputs>({ defaultValues: { message: '' } });
        return (
            <FormProvider {...methods}>
                <FormField
                    control={methods.control}
                    name="message"
                    handleChange={(e) => {
                        methods.setValue('message', e.target.value);
                        onValue(e.target.value);
                    }}
                />
            </FormProvider>
        );
    }

    it('sets maxLength=140 on the message input and clamps UTF-8 bytes to 140', () => {
        let latest = '';
        render(<MessageFormHarness onValue={(val) => (latest = val)} />);

        const input = screen.getByTestId('send-input-message') as HTMLInputElement;
        expect(input.maxLength).toBe(MAX_PAYMENT_ID_BYTES);

        const overLimitAscii = 'a'.repeat(200);
        fireEvent.change(input, { target: { value: overLimitAscii } });
        expect(latest).toHaveLength(MAX_PAYMENT_ID_BYTES);

        // 40 4-byte emojis = 160 UTF-8 bytes; must truncate to 35 emojis (140 bytes)
        const emojis = '🔥'.repeat(40);
        fireEvent.change(input, { target: { value: emojis } });
        expect(new TextEncoder().encode(latest).byteLength).toBe(MAX_PAYMENT_ID_BYTES);
        expect(truncateToUtf8Bytes(emojis, MAX_PAYMENT_ID_BYTES)).toBe('🔥'.repeat(35));
    });
});

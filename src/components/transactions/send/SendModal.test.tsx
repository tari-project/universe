/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
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
        vi.mocked(invoke).mockReset();
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

    it('estimates and displays the network fee on the review screen', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        vi.mocked(invoke).mockImplementation((async (cmd: string) => {
            if (cmd === 'estimate_l1_send_fee') return 1_250;
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
});

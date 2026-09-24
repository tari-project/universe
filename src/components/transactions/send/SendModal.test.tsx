/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { render, screen, waitFor, fireEvent } from '@app/test/test-utils';
import { useWalletStore } from '@app/store/useWalletStore';
import SendModal from './SendModal';

// SendModal reaches the store barrel for the error toast, and one of the stores in there
// grabs the Tauri window at import time.
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({
        onCloseRequested: vi.fn(),
        listen: vi.fn(),
    })),
}));

// The real form validates the address against the backend and gates its submit button on
// the result, none of which matters here. Stand in a form that fills a valid payload and
// exposes the submit button, so the tests drive SendModal's step logic alone.
vi.mock('./SendForm.tsx', async () => {
    const React = await import('react');
    const { useFormContext } = await import('react-hook-form');
    return {
        SendForm: ({ hasReviewStep }: { hasReviewStep?: boolean }) => {
            const { setValue } = useFormContext();
            React.useEffect(() => {
                setValue('address', 'f4destination');
                setValue('amount', 2);
                setValue('message', 'hello');
            }, [setValue]);
            return React.createElement(
                'button',
                { type: 'submit', 'data-testid': 'send-review-button' },
                hasReviewStep ? 'send.cta-review' : 'send.cta-send'
            );
        },
    };
});

const SEND_COMMAND = 'send_one_sided_to_stealth_address';
// `invoke` is typed per command, so its recorded calls are a union of tuples; widen them
// to compare the command name.
const sendCalls = () =>
    (vi.mocked(invoke).mock.calls as unknown as [string, unknown][]).filter(([command]) => command === SEND_COMMAND);

function renderModal() {
    return render(<SendModal section="send" setSection={vi.fn()} />);
}

describe('SendModal', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockClear();
    });

    it('without a PIN, submits straight into the backend gate so its dialog is the only confirmation', async () => {
        useWalletStore.setState({ is_pin_locked: false });
        renderModal();

        const submit = await screen.findByTestId('send-review-button');
        expect(submit).toHaveTextContent('send.cta-send');
        fireEvent.click(submit);

        await waitFor(() => expect(sendCalls()).toHaveLength(1));
        expect(sendCalls()[0][1]).toEqual({ amount: '2', destination: 'f4destination', paymentId: 'hello' });
        expect(screen.queryByText('send.review-title')).not.toBeInTheDocument();
        expect(screen.queryByTestId('send-confirm-button')).not.toBeInTheDocument();
    });

    it('with a PIN, reviews in-app first and only sends once the review is confirmed', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        renderModal();

        const submit = await screen.findByTestId('send-review-button');
        expect(submit).toHaveTextContent('send.cta-review');
        fireEvent.click(submit);

        expect(await screen.findByText('send.review-title')).toBeInTheDocument();
        expect(sendCalls()).toHaveLength(0);

        fireEvent.click(screen.getByTestId('send-confirm-button'));
        await waitFor(() => expect(sendCalls()).toHaveLength(1));
    });
});

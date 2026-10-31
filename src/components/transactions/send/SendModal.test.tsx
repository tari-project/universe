/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
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

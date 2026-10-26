/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, type Mock } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { FormProvider, useForm } from 'react-hook-form';
import { render, screen, fireEvent } from '@app/test/test-utils';
import { useWalletStore } from '@app/store/useWalletStore';
import type { SendInputs } from './types';
import { SendForm } from './SendForm';

function Form() {
    const methods = useForm<SendInputs>({ defaultValues: { address: '', amount: undefined } });
    return (
        <FormProvider {...methods}>
            <SendForm />
        </FormProvider>
    );
}

describe('SendForm', () => {
    it('says so when the max amount cannot be worked out', async () => {
        useWalletStore.setState((s) => ({
            wallet_scanning: { ...s.wallet_scanning, is_initial_scan_complete: true },
        }));
        const invokeMock = vi.mocked(invoke) as unknown as Mock<(command: string) => Promise<unknown>>;
        invokeMock.mockImplementation(async (command) => {
            if (command === 'get_max_sendable_amount') {
                throw 'No wallet account found';
            }
            return [];
        });
        render(<Form />);

        fireEvent.click(screen.getByText('send.max'));

        expect(await screen.findByText('send.error-max-unavailable')).toBeInTheDocument();
        invokeMock.mockResolvedValue([]);
    });
});

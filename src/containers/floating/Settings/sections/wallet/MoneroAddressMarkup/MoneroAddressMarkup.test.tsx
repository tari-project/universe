import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@app/test/test-utils';
import { setMoneroAddress } from '@app/store';
import MoneroAddressMarkup from './MoneroAddressMarkup';

vi.mock('@app/store', () => ({
    setMoneroAddress: vi.fn(() => Promise.resolve()),
    useConfigWalletStore: (select: (s: { monero_address: string }) => string) =>
        select({ monero_address: `4A${'a'.repeat(93)}` }),
}));

describe('MoneroAddressMarkup', () => {
    it('requires an address, so clearing the field never applies an empty one', async () => {
        render(<MoneroAddressMarkup />);

        const input = screen.getByTestId('wallet-monero-address');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: '' } });

        expect(await screen.findByText('Monero address is required')).toBeInTheDocument();
        await act(async () => {
            fireEvent.submit(input.closest('form') as HTMLFormElement);
        });
        expect(setMoneroAddress).not.toHaveBeenCalled();
    });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@app/test/test-utils';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import ActionCopyAddress from './ActionCopyAddress';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
    clipboard: {
        writeText: mockWriteText,
    },
});

describe('ActionCopyAddress', () => {
    beforeEach(() => {
        mockWriteText.mockClear();
        useWalletStore.setState({ tari_address_base58: '11111111111111111111111111111111' });
    });

    it('uses wallet store address by default', async () => {
        render(<ActionCopyAddress />);
        const button = screen.getByTestId('wallet-copy-address');
        expect(button).toBeEnabled();
        await act(async () => {
            fireEvent.click(button);
        });
        expect(mockWriteText).toHaveBeenCalledWith('11111111111111111111111111111111');
    });

    it('supports custom address and custom testId for L2 wallet', async () => {
        const customAddress = '22222222222222222222222222222222';
        render(<ActionCopyAddress address={customAddress} testId="l2-copy-address" />);
        const button = screen.getByTestId('l2-copy-address');
        expect(button).toBeEnabled();
        await act(async () => {
            fireEvent.click(button);
        });
        expect(mockWriteText).toHaveBeenCalledWith(customAddress);
    });
});

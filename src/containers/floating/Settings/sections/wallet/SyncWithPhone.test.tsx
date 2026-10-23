import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@app/test/test-utils';
import { usePaperWalletStore } from '@app/store/usePaperWalletStore';
import { SyncWithPhone } from './SyncWithPhone';

describe('SyncWithPhone', () => {
    it('is unavailable in this version and says so', () => {
        render(<SyncWithPhone />);

        const button = screen.getByTestId('wallet-sync-phone');
        expect(button).toBeDisabled();
        expect(screen.getByTestId('wallet-sync-phone-unavailable')).toHaveTextContent(
            'sidebar:paper-wallet-unavailable'
        );
        fireEvent.click(button);
        expect(usePaperWalletStore.getState().showModal).toBe(false);
    });

    it('never opens the modal from anywhere else either', () => {
        usePaperWalletStore.getState().setShowModal(true);
        expect(usePaperWalletStore.getState().showModal).toBe(false);
    });
});

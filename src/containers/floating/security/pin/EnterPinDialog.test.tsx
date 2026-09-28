import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emit } from '@tauri-apps/api/event';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { closePinPrompt, useSecurityStore } from '@app/store/useSecurityStore.ts';
import { initialState, useL2WalletStore } from '@app/store/useL2WalletStore.ts';
import en from '../../../../../public/locales/en/wallet.json';
import EnterPinDialog from './EnterPinDialog';
import ForgotPinDialog from './ForgotPinDialog';

vi.mock('@tauri-apps/api/event', () => ({ emit: vi.fn(() => Promise.resolve()) }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

const pinStrings = en.security.pin as Record<string, string>;

describe('EnterPinDialog', () => {
    beforeEach(() => {
        vi.mocked(emit).mockClear();
    });

    it.each([
        ['l2_unlock', 'l2-unlock'],
        ['l2_seed_export', 'l2-seed-export'],
        ['l2_seed_import', 'l2-seed-import'],
        ['l2_seed_reset', 'l2-seed-reset'],
    ] as const)('says what a %s prompt authorises', (kind, key) => {
        useSecurityStore.setState({ modal: 'enter_pin', pinContext: { kind }, pinPromptId: 1 });
        render(<EnterPinDialog />);
        expect(screen.getByText(`security.pin.${key}`)).toBeInTheDocument();
        expect(pinStrings[key]).toBeTruthy();
    });

    it('answers with the id of the prompt it shows', async () => {
        useSecurityStore.setState({ modal: 'enter_pin', pinContext: null, pinPromptId: 42 });
        const { unmount } = render(<EnterPinDialog />);
        // The last digit submits on its own.
        screen
            .getByTestId('pin-input')
            .querySelectorAll('input')
            .forEach((input, i) => fireEvent.change(input, { target: { value: `${i + 1}` } }));
        await waitFor(() => expect(emit).toHaveBeenCalledWith('pin-dialog-response', { id: 42, pin: '123456' }));
        unmount();

        useSecurityStore.setState({ modal: 'enter_pin' });
        render(<EnterPinDialog />);
        fireEvent.click(screen.getByText('security.pin.forgot'));
        expect(emit).toHaveBeenLastCalledWith('pin-dialog-response', { id: 42, pin: undefined });
    });

    it('closes only when the backend gives up on the prompt it shows', () => {
        useSecurityStore.setState({ modal: 'enter_pin', pinPromptId: 7 });
        closePinPrompt(6);
        expect(useSecurityStore.getState().modal).toBe('enter_pin');
        closePinPrompt(7);
        expect(useSecurityStore.getState().modal).toBeNull();
    });
});

describe('ForgotPinDialog', () => {
    it('warns only when the reset deletes an imported L2 wallet', () => {
        useSecurityStore.setState({ modal: 'forgot_pin' });
        useL2WalletStore.setState({ ...initialState, enabled: true, seed_source: 'l1' });
        const { unmount } = render(<ForgotPinDialog />);
        expect(screen.queryByText('security.pin.forgot-l2-imported-warning')).not.toBeInTheDocument();
        unmount();

        useL2WalletStore.setState({ seed_source: 'imported' });
        render(<ForgotPinDialog />);
        expect(screen.getByText('security.pin.forgot-l2-imported-warning')).toBeInTheDocument();
        expect(pinStrings['forgot-l2-imported-warning']).toBeTruthy();
    });
});

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

    it.each([
        ['tapplet', true],
        ['app', false],
    ] as const)('shows the pay ref of an L2 send from %s, labelled only for a tapplet', (origin, labelled) => {
        useSecurityStore.setState({
            modal: 'enter_pin',
            pinPromptId: 1,
            pinContext: {
                kind: 'l2_send',
                amount_micro_minotari: 1_000_000,
                destination: 'otl_esm_1bridge',
                account: 'component_abc',
                pay_ref: '0f8fad5b-d9cb-469f-a165-70867728950e',
                origin,
                fee_micro_minotari: 10,
            },
        });
        render(<EnterPinDialog />);
        expect(screen.getByText('0f8fad5b-d9cb-469f-a165-70867728950e')).toBeInTheDocument();
        expect(screen.queryByText('security.pin.requested-by-tapplet') !== null).toBe(labelled);
        expect(
            screen.getByText(labelled ? 'security.pin.approve-tapplet-send' : 'security.pin.approve-send')
        ).toBeInTheDocument();
        expect(pinStrings['requested-by-tapplet']).toBe('Requested by the bridge tapplet');
        expect(pinStrings['approve-tapplet-send']).toBe('Bridge tapplet is asking to send');
    });

    it('puts the tapplet label above the summary at normal prominence', () => {
        useSecurityStore.setState({
            modal: 'enter_pin',
            pinPromptId: 1,
            pinContext: {
                kind: 'l2_send',
                amount_micro_minotari: 1,
                destination: 'otl_esm_1bridge',
                account: 'component_abc',
                pay_ref: null,
                origin: 'tapplet',
                fee_micro_minotari: null,
            },
        });
        render(<EnterPinDialog />);
        const label = screen.getByText('security.pin.requested-by-tapplet');
        const destination = screen.getByText('otl_esm_1bridge');
        expect(label.compareDocumentPosition(destination) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(label.getAttribute('style') ?? '').not.toMatch(/opacity|font-size/);
    });

    it.each([
        ['l2_send', 10_049_990_000, '10,049.990000'],
        ['l2_send', 1, '0.000001'],
        ['send', 10_049_990_000, '10.04K'],
    ] as const)('shows a %s of %d micro as %s', (kind, amount, shown) => {
        const pinContext =
            kind === 'l2_send'
                ? {
                      kind,
                      amount_micro_minotari: amount,
                      destination: 'otl_esm_1bridge',
                      account: 'component_abc',
                      pay_ref: null,
                      origin: 'app' as const,
                      fee_micro_minotari: null,
                  }
                : { kind, amount_micro_minotari: amount, destination: 'tari-address', payment_id: null };
        useSecurityStore.setState({ modal: 'enter_pin', pinPromptId: 1, pinContext });
        render(<EnterPinDialog />);
        expect(screen.getByText(shown)).toBeInTheDocument();
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

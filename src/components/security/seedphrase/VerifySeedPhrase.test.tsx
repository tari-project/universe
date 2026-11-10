import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { VerifySeedPhrase } from './VerifySeedPhrase';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

const WORDS = ['alpha', 'bravo', 'charlie'];

const completeAndSubmit = async () => {
    render(<VerifySeedPhrase words={WORDS} />);
    for (const word of WORDS) {
        fireEvent.click(screen.getByText(word));
    }
    const submit = screen.getByText('verifySeed.button').closest('button');
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit!);
    await waitFor(() => expect(invoke).toHaveBeenCalledWith('set_seed_backed_up'));
};

describe('VerifySeedPhrase PIN creation (#3518)', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        vi.mocked(invoke).mockResolvedValue(undefined as never);
    });

    it('creates a PIN after backup when the wallet is known to have none', async () => {
        useWalletStore.setState({ is_pin_locked: false });
        await completeAndSubmit();
        await waitFor(() => expect(invoke).toHaveBeenCalledWith('create_pin'));
    });

    it('does not create a PIN while the PIN state is unknown', async () => {
        useWalletStore.setState({ is_pin_locked: undefined });
        await completeAndSubmit();
        expect(invoke).not.toHaveBeenCalledWith('create_pin');
    });

    it('creates a PIN when the state is unknown but the backend reports none', async () => {
        useWalletStore.setState({ is_pin_locked: undefined });
        vi.mocked(invoke).mockImplementation((async (cmd: string) => {
            if (cmd === 'is_pin_locked') return false;
            return undefined;
        }) as typeof invoke);
        await completeAndSubmit();
        await waitFor(() => expect(invoke).toHaveBeenCalledWith('create_pin'));
        expect(useWalletStore.getState().is_pin_locked).toBe(false);
    });

    it('does not create a PIN when the state is unknown but the backend reports one is set', async () => {
        useWalletStore.setState({ is_pin_locked: undefined });
        vi.mocked(invoke).mockImplementation((async (cmd: string) => {
            if (cmd === 'is_pin_locked') return true;
            return undefined;
        }) as typeof invoke);
        await completeAndSubmit();
        await waitFor(() => expect(invoke).toHaveBeenCalledWith('is_pin_locked'));
        expect(invoke).not.toHaveBeenCalledWith('create_pin');
        expect(useWalletStore.getState().is_pin_locked).toBe(true);
    });

    it('does not create a PIN when one is already set', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        await completeAndSubmit();
        expect(invoke).not.toHaveBeenCalledWith('create_pin');
    });
});

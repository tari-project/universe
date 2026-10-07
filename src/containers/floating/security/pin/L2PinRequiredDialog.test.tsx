import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { useSecurityStore } from '@app/store/useSecurityStore.ts';
import L2PinRequiredDialog from './L2PinRequiredDialog.tsx';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

describe('L2PinRequiredDialog', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        useSecurityStore.setState({ modal: 'l2_pin_required' });
    });

    it('sets the PIN and opens L2 in one step', async () => {
        render(<L2PinRequiredDialog />);

        fireEvent.click(screen.getByTestId('l2-pin-required-set'));
        await waitFor(() => expect(invoke).toHaveBeenCalledWith('l2_create_pin_and_enable'));
        expect(useSecurityStore.getState().modal).toBeNull();
    });

    it('closes on Cancel without touching L2', () => {
        render(<L2PinRequiredDialog />);

        fireEvent.click(screen.getByText('common:cancel'));
        expect(useSecurityStore.getState().modal).toBeNull();
        expect(invoke).not.toHaveBeenCalled();
    });
});

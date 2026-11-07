import { describe, it, expect, beforeEach } from 'vitest';
import { useWalletStore, initialState } from './useWalletStore';

describe('useWalletStore - PIN loading state', () => {
    beforeEach(() => {
        useWalletStore.setState(initialState);
    });

    it('should initialize is_pin_locked as undefined (loading state)', () => {
        const state = useWalletStore.getState();
        expect(state.is_pin_locked).toBeUndefined();
    });

    it('should allow setting is_pin_locked to true', () => {
        useWalletStore.setState({ is_pin_locked: true });
        expect(useWalletStore.getState().is_pin_locked).toBe(true);
    });

    it('should allow setting is_pin_locked to false', () => {
        useWalletStore.setState({ is_pin_locked: false });
        expect(useWalletStore.getState().is_pin_locked).toBe(false);
    });

    it('should support three distinct states: undefined, true, false', () => {
        useWalletStore.setState({ is_pin_locked: undefined });
        expect(useWalletStore.getState().is_pin_locked).toBeUndefined();
        
        useWalletStore.setState({ is_pin_locked: true });
        expect(useWalletStore.getState().is_pin_locked).toBe(true);
        
        useWalletStore.setState({ is_pin_locked: false });
        expect(useWalletStore.getState().is_pin_locked).toBe(false);
    });
});

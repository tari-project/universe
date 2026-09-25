import { describe, it, expect, beforeEach } from 'vitest';
import { initialState, selectL2Account, useL2WalletStore } from '../useL2WalletStore';
import { handleL2ClaimResult, handleL2WalletStateUpdate } from './l2WalletStoreActions';
import { useToastStore } from '@app/components/ToastStack/useToastStore';
import type { L2Account } from '@app/types/events-payloads.ts';

const account = (name: string, is_default: boolean): L2Account => ({
    name,
    address: `otl_${name}`,
    component_address: `component_${name}`,
    public_key: name.padEnd(64, '0'),
    is_default,
    balance: { revealed: 0, confidential: 1_000_000 },
    history: [{ id: 1, transaction_id: null, amount: 1_000_000, source: 'scan', timestamp: 1 }],
    transactions: [],
});

describe('handleL2WalletStateUpdate', () => {
    beforeEach(() => {
        useL2WalletStore.setState({ ...initialState }, true);
    });

    it('replaces the stored state with the latest update', () => {
        handleL2WalletStateUpdate({
            enabled: true,
            seed_source: 'l1',
            accounts: [account('a', true), account('b', false)],
        });
        handleL2WalletStateUpdate({ enabled: true, seed_source: 'l1', accounts: [account('b', false)] });

        const state = useL2WalletStore.getState();
        expect(state.accounts.map((a) => a.name)).toEqual(['b']);
        expect(state.accounts[0].history).toHaveLength(1);
    });

    it('selects the default account, else the first', () => {
        handleL2WalletStateUpdate({
            enabled: true,
            seed_source: 'l1',
            accounts: [account('a', false), account('b', true)],
        });
        expect(selectL2Account(useL2WalletStore.getState())?.name).toBe('b');

        handleL2WalletStateUpdate({
            enabled: true,
            seed_source: 'l1',
            accounts: [account('a', false), account('c', false)],
        });
        expect(selectL2Account(useL2WalletStore.getState())?.name).toBe('a');

        handleL2WalletStateUpdate(initialState);
        expect(selectL2Account(useL2WalletStore.getState())).toBeUndefined();
    });
});

describe('handleL2ClaimResult', () => {
    const result = {
        commitment: 'aa'.repeat(32),
        accepted: false,
        reason: 'Insufficient funds',
        not_yet_claimable: false,
    };
    const lastToast = () => useToastStore.getState().toasts.slice(-1)[0];

    it('toasts success when the claim is accepted', () => {
        handleL2ClaimResult({ ...result, accepted: true, reason: null });
        expect(lastToast()).toMatchObject({ type: 'success', title: 'l2.claim.confirmed' });
    });

    it('toasts the reject reason', () => {
        handleL2ClaimResult(result);
        expect(lastToast()).toMatchObject({ type: 'error', title: 'l2.claim.rejected', text: 'Insufficient funds' });
    });

    it('explains a burn the L2 has not seen yet instead of the raw reason', () => {
        handleL2ClaimResult({ ...result, reason: 'is not yet claimable', not_yet_claimable: true });
        expect(lastToast()).toMatchObject({ type: 'error', text: 'l2.claim.not-yet-claimable' });
    });
});

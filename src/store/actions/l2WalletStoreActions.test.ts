import { describe, it, expect, beforeEach } from 'vitest';
import { initialState, selectL2Account, useL2WalletStore } from '../useL2WalletStore';
import { handleL2WalletStateUpdate } from './l2WalletStoreActions';
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
        handleL2WalletStateUpdate({ enabled: true, accounts: [account('a', true), account('b', false)] });
        handleL2WalletStateUpdate({ enabled: true, accounts: [account('b', false)] });

        const state = useL2WalletStore.getState();
        expect(state.accounts.map((a) => a.name)).toEqual(['b']);
        expect(state.accounts[0].history).toHaveLength(1);
    });

    it('selects the default account, else the first', () => {
        handleL2WalletStateUpdate({ enabled: true, accounts: [account('a', false), account('b', true)] });
        expect(selectL2Account(useL2WalletStore.getState())?.name).toBe('b');

        handleL2WalletStateUpdate({ enabled: true, accounts: [account('a', false), account('c', false)] });
        expect(selectL2Account(useL2WalletStore.getState())?.name).toBe('a');

        handleL2WalletStateUpdate(initialState);
        expect(selectL2Account(useL2WalletStore.getState())).toBeUndefined();
    });
});

import { describe, it, expect } from 'vitest';
import { DisplayedTransaction } from '@app/types/app-status.ts';
import { mergeTransactions } from './helpers.ts';

const tx = (id: number, timestamp: string, amount = 1000) =>
    ({ id, amount, blockchain: { timestamp } }) as DisplayedTransaction;

describe('mergeTransactions', () => {
    it('updates a matching transaction in place instead of duplicating it', () => {
        const merged = mergeTransactions([tx(1, '2026-09-23T00:00:00')], [tx(1, '2026-09-23T00:00:00', 2000)], true);

        expect(merged).toHaveLength(1);
        expect(merged[0].amount).toBe(2000);
    });

    it('keeps bridge details the update does not carry', () => {
        const existing = { ...tx(1, '2026-09-23T00:00:00'), bridge_transaction_details: { status: 'done' } };
        const merged = mergeTransactions(
            [existing as DisplayedTransaction],
            [tx(1, '2026-09-23T00:00:00', 2000)],
            false
        );

        expect(merged[0].bridge_transaction_details).toEqual({ status: 'done' });
    });

    it('adds unknown transactions only when upserting', () => {
        const current = [tx(1, '2026-09-23T00:00:00')];

        expect(mergeTransactions(current, [tx(2, '2026-09-24T00:00:00')], false)).toBe(current);
        expect(mergeTransactions(current, [tx(2, '2026-09-24T00:00:00')], true)).toHaveLength(2);
    });

    it('returns the list sorted by newest first', () => {
        const merged = mergeTransactions(
            [tx(1, '2026-09-22T00:00:00'), tx(2, '2026-09-24T00:00:00')],
            [tx(3, '2026-09-23T00:00:00')],
            true
        );

        expect(merged.map((t) => t.id)).toEqual([2, 3, 1]);
    });
});

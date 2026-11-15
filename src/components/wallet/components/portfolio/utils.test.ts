import { describe, expect, it } from 'vitest';
import { DisplayedTransaction, TransactionDirection, TransactionDisplayStatus } from '@app/types/app-status.ts';
import { buildPortfolioSeries, getPortfolioChangePercent, getPortfolioSummary } from './utils.ts';

function makeTx(overrides: Partial<DisplayedTransaction>): DisplayedTransaction {
    return {
        id: 1,
        direction: TransactionDirection.Incoming,
        source: 'transfer' as DisplayedTransaction['source'],
        status: TransactionDisplayStatus.Confirmed,
        amount: 0,
        message: null,
        counterparty: null,
        blockchain: {
            block_height: 1,
            timestamp: new Date('2025-01-01T00:00:00Z').toISOString(),
            confirmations: 1,
            block_hash: [],
        },
        fee: null,
        details: {} as DisplayedTransaction['details'],
        lock_height: 0,
        ...overrides,
    };
}

const MICRO = 1_000_000;

describe('buildPortfolioSeries', () => {
    it('returns a single point equal to the current balance when there are no transactions', () => {
        const series = buildPortfolioSeries([], 500 * MICRO);
        expect(series).toHaveLength(1);
        expect(series[0].balance).toBe(500);
    });

    it('reconstructs the balance chronologically ending at the current total', () => {
        const txs = [
            makeTx({
                id: 2,
                direction: TransactionDirection.Incoming,
                amount: 100 * MICRO,
                blockchain: { ...makeTx({}).blockchain, timestamp: new Date('2025-01-03T00:00:00Z').toISOString() },
            }),
            makeTx({
                id: 1,
                direction: TransactionDirection.Incoming,
                amount: 50 * MICRO,
                blockchain: { ...makeTx({}).blockchain, timestamp: new Date('2025-01-02T00:00:00Z').toISOString() },
            }),
        ];
        const series = buildPortfolioSeries(txs, 150 * MICRO);
        expect(series.map((p) => p.balance)).toEqual([0, 50, 150]);
        expect(series[0].timestamp).toBeLessThanOrEqual(series[1].timestamp);
        expect(series[1].timestamp).toBeLessThan(series[2].timestamp);
    });

    it('subtracts outgoing amounts and fees', () => {
        const txs = [
            makeTx({
                id: 1,
                direction: TransactionDirection.Incoming,
                amount: 200 * MICRO,
                blockchain: { ...makeTx({}).blockchain, timestamp: new Date('2025-01-01T00:00:00Z').toISOString() },
            }),
            makeTx({
                id: 2,
                direction: TransactionDirection.Outgoing,
                amount: 60 * MICRO,
                fee: { amount: 2 * MICRO },
                blockchain: { ...makeTx({}).blockchain, timestamp: new Date('2025-01-02T00:00:00Z').toISOString() },
            }),
        ];
        const series = buildPortfolioSeries(txs, 138 * MICRO);
        expect(series.map((p) => p.balance)).toEqual([0, 200, 138]);
    });

    it('ignores transactions that have not settled', () => {
        const txs = [
            makeTx({ id: 1, status: TransactionDisplayStatus.Pending, amount: 999 * MICRO }),
            makeTx({ id: 2, status: TransactionDisplayStatus.Cancelled, amount: 999 * MICRO }),
        ];
        const series = buildPortfolioSeries(txs, 10 * MICRO);
        expect(series).toHaveLength(1);
        expect(series[0].balance).toBe(10);
    });
});

describe('getPortfolioChangePercent', () => {
    it('returns 0 for fewer than two points', () => {
        expect(getPortfolioChangePercent([{ timestamp: 1, balance: 100 }])).toBe(0);
        expect(getPortfolioChangePercent([])).toBe(0);
    });

    it('computes the percent change between first and last point', () => {
        const series = [
            { timestamp: 1, balance: 100 },
            { timestamp: 2, balance: 150 },
        ];
        expect(getPortfolioChangePercent(series)).toBe(50);
    });

    it('returns 0 when the starting balance is zero', () => {
        const series = [
            { timestamp: 1, balance: 0 },
            { timestamp: 2, balance: 100 },
        ];
        expect(getPortfolioChangePercent(series)).toBe(0);
    });
});

describe('getPortfolioSummary', () => {
    it('combines series and change percent', () => {
        const txs = [
            makeTx({
                id: 1,
                direction: TransactionDirection.Incoming,
                amount: 100 * MICRO,
                blockchain: { ...makeTx({}).blockchain, timestamp: new Date('2025-01-01T00:00:00Z').toISOString() },
            }),
        ];
        const { series, changePercent } = getPortfolioSummary(txs, 200 * MICRO);
        expect(series[series.length - 1].balance).toBe(200);
        expect(changePercent).toBe(100);
    });
});

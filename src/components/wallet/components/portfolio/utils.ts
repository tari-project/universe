import { DisplayedTransaction, TransactionDirection, TransactionDisplayStatus } from '@app/types/app-status.ts';

export interface PortfolioPoint {
    /** Unix epoch milliseconds. */
    timestamp: number;
    /** Balance in whole XTM at this point in time. */
    balance: number;
}

const MICRO_XTM = 1_000_000;

/** Statuses that actually moved funds and are reflected in the current balance. */
const SETTLED_STATUSES = new Set<TransactionDisplayStatus>([
    TransactionDisplayStatus.Confirmed,
    TransactionDisplayStatus.Unconfirmed,
]);

function toXTM(micro: number): number {
    return micro / MICRO_XTM;
}

/**
 * Reconstructs the balance over time from the current total and the settled
 * transactions, oldest first. The first point is the balance before the oldest
 * known transaction; the last point always equals the current total.
 */
export function buildPortfolioSeries(
    transactions: DisplayedTransaction[],
    currentTotalMicroXTM: number
): PortfolioPoint[] {
    const settled = transactions
        .filter((tx) => SETTLED_STATUSES.has(tx.status))
        .map((tx) => ({
            timestamp: new Date(tx.blockchain.timestamp).getTime(),
            delta: tx.direction === TransactionDirection.Incoming ? tx.amount : -(tx.amount + (tx.fee?.amount ?? 0)),
        }))
        .filter((point) => Number.isFinite(point.timestamp))
        .sort((a, b) => a.timestamp - b.timestamp);

    const totalDelta = settled.reduce((sum, point) => sum + point.delta, 0);
    const startBalance = currentTotalMicroXTM - totalDelta;
    let balance = startBalance;

    const series: PortfolioPoint[] = settled.map((point) => {
        balance += point.delta;
        return { timestamp: point.timestamp, balance: toXTM(balance) };
    });

    if (series.length === 0) {
        return [{ timestamp: Date.now(), balance: toXTM(currentTotalMicroXTM) }];
    }

    series.unshift({ timestamp: series[0].timestamp, balance: toXTM(startBalance) });
    return series;
}

/**
 * Percent change between the first and the last point of the series.
 * Returns 0 when the starting balance is zero.
 */
export function getPortfolioChangePercent(series: PortfolioPoint[]): number {
    if (series.length < 2) return 0;
    const start = series[0].balance;
    const end = series[series.length - 1].balance;
    if (start <= 0) return 0;
    return ((end - start) / start) * 100;
}

/** Convenience wrapper used by the chart header. */
export function getPortfolioSummary(
    transactions: DisplayedTransaction[],
    currentTotalMicroXTM: number
): { series: PortfolioPoint[]; changePercent: number } {
    const series = buildPortfolioSeries(transactions, currentTotalMicroXTM);
    return { series, changePercent: getPortfolioChangePercent(series) };
}

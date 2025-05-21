import { TransactionStatus } from '@app/types/transactions.ts';

export function getTxStatusString(statusNumber: number): string {
    const keyNamesOnly = Object.keys(TransactionStatus).filter((key) => isNaN(Number(key)));
    return keyNamesOnly[statusNumber];
}

import { TransactionStatus, StatusMapped } from '@app/types/transactions.ts';

export function getTxStatus(_status = 3) {
    const bla = Object.keys(TransactionStatus);
    const bla2 = Object.keys(StatusMapped);
    const bla3 = bla[_status];
    const bla4 = bla2[_status];
    const bla5 = TransactionStatus[bla4];
}

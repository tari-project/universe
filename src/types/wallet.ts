import { TransactionInfo } from '@app/types/app-status.ts';

export type TxType = 'won' | 'sent' | 'received';
export interface Transaction extends TransactionInfo {
    type?: TxType;
    blockHeight?: number;
}

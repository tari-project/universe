import { TransactionInfo } from '@app/types/app-status.ts';

export interface Transaction extends TransactionInfo {
    blockHeight?: number;
}

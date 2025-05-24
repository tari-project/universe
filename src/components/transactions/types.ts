import { TransactionInfo } from '@app/types/app-status.ts';
import { TransactionDirection } from '@app/types/transactions.ts';

export type TransationType = 'mined' | 'sent' | 'received' | 'unknown';

export interface HistoryListItemProps {
    item: TransactionInfo;
    index: number;
    itemIsNew?: boolean;
    setDetailsItem?: (item: TransactionInfo | null) => void;
}

export interface BaseItemProps {
    title: string;
    direction: TransactionDirection;
    time: string;
    value: string;
    chip?: string;
    status?: number;
    onClick?: () => void;
}

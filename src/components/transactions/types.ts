import { CombinedBridgeWalletTransaction } from '@app/store';
import { TransactionDirection } from '@app/types/transactions.ts';

export type TransactionType = 'mined' | 'sent' | 'received' | 'unknown';

export interface HistoryListItemProps {
    item: CombinedBridgeWalletTransaction;
    index: number;
    itemIsNew?: boolean;
    setDetailsItem?: (item: CombinedBridgeWalletTransaction | null) => void;
}

export interface BaseItemProps {
    title: string;
    direction: TransactionDirection;
    time: string;
    value: string;
    chip?: string;
    onClick?: () => void;
    hideWalletBalance?: boolean;
}

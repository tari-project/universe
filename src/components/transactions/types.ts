import { BackendBridgeTransaction, CombinedBridgeWalletTransaction } from '@app/store';
import { TransactionDirection } from '@app/types/transactions.ts';
import { UserTransactionDTO } from '@tari-project/wxtm-bridge-backend-api';

export type TransationType = 'mined' | 'sent' | 'received' | 'unknown';

export interface HistoryListItemProps {
    item: CombinedBridgeWalletTransaction;
    index: number;
    itemIsNew?: boolean;
    setDetailsItem?: (item: CombinedBridgeWalletTransaction | null) => void;
}

export interface BridgeHistoryListItemProps {
    item: BackendBridgeTransaction;
    index: number;
    itemIsNew?: boolean;
    setDetailsItem?: (item: BackendBridgeTransaction | null) => void;
}

export interface BaseItemProps {
    title: string;
    direction: TransactionDirection;
    time: string;
    value: string;
    chip?: string;
    onClick?: () => void;
}

export interface BridgeBaseItemProps {
    title: string;
    time: string;
    value: string;
    chip?: string;
    status?: UserTransactionDTO.status;
    onClick?: () => void;
}

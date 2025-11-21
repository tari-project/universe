import { CombinedBridgeWalletTransaction } from '@app/store';

export type TransationType = 'mined' | 'sent' | 'received' | 'unknown';

export interface HistoryListItemProps {
    item: CombinedBridgeWalletTransaction;
    index: number;
    setDetailsItem?: (item: CombinedBridgeWalletTransaction | null) => void;
}

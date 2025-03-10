import { TransactionInfo, TxType } from '@app/types/app-status.ts';

export interface HistoryListItemProps {
    item: TransactionInfo;
    showReplay?: boolean;
    index: number;
}

export interface BaseItemProps {
    title: string;
    type: TxType;
    time: string;
    value: string;
    chip?: string;
    onClick?: () => void;
}

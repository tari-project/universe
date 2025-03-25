import { TransactionInfo } from '@app/types/app-status.ts';

export type TransationType = 'mined' | 'sent' | 'received' | 'unknown';

export interface HistoryListItemProps {
    item: TransactionInfo;
    index: number;
}

export interface BaseItemProps {
    title: string;
    type: TransationType;
    time: string;
    value: string;
    chip?: string;
    onClick?: () => void;
}

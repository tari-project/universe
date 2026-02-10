import i18n from 'i18next';
import { DisplayedTransaction } from '@app/types/app-status';
import { TransactionType } from '../types';
import { useConfigUIStore } from '@app/store';

/**
 * Formats the blockchain timestamp from DisplayedTransaction into a readable format
 * @param timestamp - ISO 8601 date string (e.g., "2025-05-13T05:25:43")
 * @returns Formatted date string (e.g., "May 13, 05:25")
 */
export const formatEffectiveDate = (timestamp: string): string => {
    const appLanguage = useConfigUIStore.getState().application_language;
    const systemLang = useConfigUIStore.getState().should_always_use_system_language;
    const date = new Date(timestamp);
    const locale = systemLang ? undefined : appLanguage;

    const fmt = new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: '2-digit',
        hour12: false,
        hour: 'numeric',
        minute: 'numeric',
    });

    return fmt.format(date);
};

export const resolveTransactionType = (transaction: DisplayedTransaction): TransactionType => {
    // Check if it's a coinbase (mining) transaction
    if (transaction.source === 'coinbase') {
        return 'mined';
    }
    // Check direction for sent/received
    if (transaction.direction === 'outgoing') {
        return 'sent';
    }
    return 'received';
};

export const resolveTransactionTitle = (transaction: DisplayedTransaction): string => {
    const itemType = resolveTransactionType(transaction);

    if (transaction.bridge_transaction_details) {
        return 'Bridge XTM to WXTM';
    }

    const typeTitle = i18n.t(`common:${itemType}`);

    // For mined transactions, show block number
    if (itemType === 'mined' && transaction.blockchain.block_height) {
        return `${i18n.t('sidebar:block')} #${transaction.blockchain.block_height}`;
    }

    // If there's a message/memo, return it
    if (transaction.message && !transaction.message.includes('<No message>')) {
        return transaction.message;
    }

    // Default to transaction type
    return typeTitle;
};

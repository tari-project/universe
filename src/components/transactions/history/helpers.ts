import i18n from 'i18next';
import { WalletTransaction, OutputType, InternalTransactionType } from '@app/types/app-status';
import { TransactionType } from '../types';
import { useConfigUIStore } from '@app/store';

/**
 * Formats the effective_date from WalletTransaction into a readable format
 * @param effectiveDate - ISO 8601 date string (e.g., "2025-05-13T05:25:43")
 * @returns Formatted date string (e.g., "May 13, 05:25")
 */
export const formatEffectiveDate = (effectiveDate: string): string => {
    const appLanguage = useConfigUIStore.getState().application_language;
    const systemLang = useConfigUIStore.getState().should_always_use_system_language;

    return new Date(effectiveDate)?.toLocaleString(systemLang ? undefined : appLanguage, {
        month: 'short',
        day: '2-digit',
        hourCycle: 'h23',
        hour: 'numeric',
        minute: 'numeric',
    });
};

export const resolveTransactionType = (txType: WalletTransaction): TransactionType => {
    const isMined = txType.outputs.some((output) => {
        return output.output_type == OutputType.Coinbase;
    });
    if (isMined) {
        return 'mined';
    }
    if (txType.internal_transaction_type === InternalTransactionType.Sent) {
        return 'sent';
    }
    return 'received';
};

export const resolveTransactionTitle = (transaction: WalletTransaction): string => {
    const itemType = resolveTransactionType(transaction);

    if (transaction.bridge_transaction_details) {
        return 'Bridge XTM to WXTM';
    }

    // Check for memo in transaction
    const txMessage = transaction.memo_parsed;

    const typeTitle = i18n.t(`common:${itemType}`);

    // For mined transactions, show block number
    if (itemType === 'mined' && transaction.mined_height) {
        return `${i18n.t('sidebar:block')} #${transaction.mined_height}`;
    }

    // If there's a memo message, return it
    if (txMessage && !txMessage.includes('<No message>')) {
        return txMessage;
    }

    // Default to transaction type
    return typeTitle;
};

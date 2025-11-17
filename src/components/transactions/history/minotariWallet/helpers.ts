import i18n from 'i18next';
import { MinotariWalletTransaction, OutputType } from '@app/types/app-status';
import { TransactionType } from '../../types';
import { useConfigUIStore } from '@app/store';

/**
 * Formats the effective_date from MinotariWalletTransaction into a readable format
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

export const resolveTransactionType = (txType: MinotariWalletTransaction): TransactionType => {
    const isMined = txType.operations.some((op) => {
        return (
            op.recieved_output_details?.output_type == OutputType.Coinbase ||
            op.spent_output_details?.output_type == OutputType.Coinbase
        );
    });
    if (isMined) {
        return 'mined';
    }
    if (txType.is_negative) {
        return 'sent';
    }
    return 'received';
};

export const resolveTransactionTitle = (transaction: MinotariWalletTransaction): string => {
    const itemType = resolveTransactionType(transaction);

    console.info('Resolved transaction type:', itemType);
    console.info('Transaction details:', transaction);

    // Check for memo in any of the operations
    const txMessage = transaction.operations.find((op) => op.memo_parsed)?.memo_parsed;

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

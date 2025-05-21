import i18n from 'i18next';
import { TransactionInfo } from '@app/types/app-status.ts';
import { formatTimeStamp } from '@app/components/transactions/history/helpers.ts';

const keyTranslations: Record<string, string> = {
    tx_id: 'wallet:send.transaction-id',
    payment_id: 'wallet:send.transaction-description',
};
function capitalizeKey(key: string): string {
    return key
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
function getLabel(key: string): string {
    return key in keyTranslations ? i18n.t(keyTranslations[key]) : capitalizeKey(key);
}

function parseValue(key: string, value): React.ReactNode {
    if (key === 'timestamp') {
        return formatTimeStamp(value);
    }
    if (key === 'amount') {
        return `${value} µT`;
    }

    return value;
}

export function getListEntries(item: TransactionInfo) {
    return Object.entries(item).map(([key, value]) => {
        return {
            label: getLabel(key),
            value: parseValue(key, value),
        };
    });
}

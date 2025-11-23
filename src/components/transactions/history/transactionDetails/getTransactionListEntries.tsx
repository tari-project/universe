import i18n from 'i18next';
import { ReactNode } from 'react';
import { formatNumber, FormatPreset } from '@app/utils';
import { StatusListEntry } from '@app/components/transactions/components/StatusList/StatusList.tsx';
import { WalletTransaction, WalletDetails, OutputType } from '@app/types/app-status.ts';
import { EmojiAddressWrapper } from '@app/components/transactions/history/transactionDetails/styles.ts';
import { formatEffectiveDate } from '../helpers';

// ============================================================================
// Helper Functions
// ============================================================================

function formatMicroTari(value: number): ReactNode {
    const preset = value.toString().length > 5 ? FormatPreset.XTM_LONG : FormatPreset.XTM_DECIMALS;
    return (
        <>
            {formatNumber(Number(value), preset)}
            <span>{` XTM`}</span>
        </>
    );
}

function capitalizeKey(key: string): string {
    return key
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// ============================================================================
// Display Order Configuration
// ============================================================================

const TRANSACTION_DISPLAY_ORDER = [
    'mined_height',
    'effective_date',
    'transaction_balance',
    'claimed_recipient_address',
    'claimed_recipient_address_emoji',
    'claimed_sender_address',
    'claimed_sender_address_emoji',
    'eth_destination_address', // Bridge-specific
    'bridge_status',
    'bridge_transaction_hash',
    'memo',
];

const OPERATION_DISPLAY_ORDER = [
    'operation_number',
    'description',
    'balance_credit',
    'balance_debit',
    'claimed_amount',
    'claimed_fee',
    'claimed_recipient_address',
    'claimed_sender_address',
    'memo',
    'confirmed_height',
    'status',
    'output_type',
    'coinbase_extra',
];

// ============================================================================
// Field Value Handlers - Transaction Level
// ============================================================================

type TransactionFieldHandler = (
    transaction: WalletTransaction
) => (Partial<StatusListEntry> & { value: ReactNode }) | null;

const transactionFieldHandlers: Record<string, TransactionFieldHandler> = {
    mined_height: (transaction) => ({
        label: 'Block Height',
        value: transaction.mined_height.toString(),
    }),

    effective_date: (transaction) => ({
        label: 'Date',
        value: formatEffectiveDate(transaction.effective_date),
    }),

    transaction_balance: (transaction) => {
        const balancePreset =
            transaction.transaction_balance.toString().length > 5 ? FormatPreset.XTM_LONG : FormatPreset.XTM_DECIMALS;
        const isNegative = transaction.internal_transaction_type === 'Sent';
        return {
            label: 'Amount',
            value: (
                <>
                    {isNegative ? '-' : '+'}
                    {formatNumber(Number(transaction.transaction_balance), balancePreset)}
                    <span>{` XTM`}</span>
                </>
            ),
            valueRight: `${formatNumber(Number(transaction.transaction_balance), FormatPreset.DECIMAL_COMPACT)} µXTM`,
        };
    },

    eth_destination_address: (transaction) => {
        const ethAddress = transaction.claimed_recipient_address;
        if (!transaction.bridge_transaction_details || !ethAddress) return null;

        return {
            label: 'Destination Address [ ETH ]',
            value: ethAddress,
        };
    },

    bridge_status: (transaction) => {
        if (!transaction.bridge_transaction_details) return null;

        return {
            label: i18n.t('common:status'),
            value: transaction.bridge_transaction_details.status,
        };
    },

    bridge_transaction_hash: (transaction) => {
        const bridgeDetails = transaction.bridge_transaction_details;
        if (!bridgeDetails?.transactionHash) return null;

        return {
            label: 'Transaction Hash',
            value: bridgeDetails.transactionHash,
        };
    },

    claimed_recipient_address: (transaction) => {
        if (!transaction.claimed_recipient_address) return null;
        return {
            label: 'Recipient Address',
            value: transaction.claimed_recipient_address,
        };
    },

    claimed_recipient_address_emoji: (transaction) => {
        if (!transaction.claimed_recipient_address_emoji) return null;
        return {
            label: 'Recipient Address (Emoji)',
            value: <EmojiAddressWrapper>{transaction.claimed_recipient_address_emoji}</EmojiAddressWrapper>,
        };
    },

    claimed_sender_address: (transaction) => {
        if (!transaction.claimed_sender_address) return null;
        return {
            label: 'Sender Address',
            value: transaction.claimed_sender_address,
        };
    },

    claimed_sender_address_emoji: (transaction) => {
        if (!transaction.claimed_sender_address_emoji) return null;
        return {
            label: 'Sender Address (Emoji)',
            value: <EmojiAddressWrapper>{transaction.claimed_sender_address_emoji}</EmojiAddressWrapper>,
        };
    },

    memo: (transaction) => {
        if (!transaction.memo_parsed) return null;

        return {
            label: 'Memo',
            value: transaction.memo_parsed,
        };
    },
};

// ============================================================================
// Field Value Handlers - Operation Level
// ============================================================================

type OperationFieldHandler = (
    operation: WalletDetails,
    index: number
) => (Partial<StatusListEntry> & { value: ReactNode }) | null;

const operationFieldHandlers: Record<string, OperationFieldHandler> = {
    operation_number: (_operation, index) => ({
        label: 'Operation',
        value: `#${index + 1}`,
    }),

    description: (operation) => {
        if (!operation.description) return null;
        return {
            label: 'Description',
            value: operation.description,
        };
    },

    balance_credit: (operation) => {
        if (operation.balance_credit <= 0) return null;
        return {
            label: 'Credit',
            value: formatMicroTari(operation.balance_credit),
            valueRight: `${formatNumber(Number(operation.balance_credit), FormatPreset.DECIMAL_COMPACT)} µXTM`,
        };
    },

    balance_debit: (operation) => {
        if (operation.balance_debit <= 0) return null;
        return {
            label: 'Debit',
            value: formatMicroTari(operation.balance_debit),
            valueRight: `${formatNumber(Number(operation.balance_debit), FormatPreset.DECIMAL_COMPACT)} µXTM`,
        };
    },

    claimed_amount: (operation) => {
        if (!operation.claimed_amount) return null;
        return {
            label: 'Claimed Amount',
            value: formatMicroTari(operation.claimed_amount),
            valueRight: `${formatNumber(Number(operation.claimed_amount), FormatPreset.DECIMAL_COMPACT)} µXTM`,
        };
    },

    claimed_fee: (operation) => {
        if (operation.claimed_fee <= 0) return null;
        return {
            label: 'Claimed Fee',
            value: formatMicroTari(operation.claimed_fee),
            valueRight: `${formatNumber(Number(operation.claimed_fee), FormatPreset.DECIMAL_COMPACT)} µXTM`,
        };
    },

    claimed_recipient_address: (operation) => {
        if (!operation.claimed_recipient_address) return null;
        return {
            label: 'Recipient Address',
            value: operation.claimed_recipient_address,
        };
    },

    claimed_sender_address: (operation) => {
        if (!operation.claimed_sender_address) return null;
        return {
            label: 'Sender Address',
            value: operation.claimed_sender_address,
        };
    },

    memo: (operation) => {
        if (!operation.memo_parsed) return null;
        return {
            label: 'Memo',
            value: operation.memo_parsed,
        };
    },

    confirmed_height: (operation) => {
        if (!operation.confirmed_height) return null;
        return {
            label: 'Confirmed Height',
            value: operation.confirmed_height.toString(),
        };
    },

    status: (operation) => ({
        label: 'Status',
        value: operation.status,
    }),

    output_type: (operation) => {
        const outputTypeLabel = OutputType[operation.output_type] || 'Unknown';
        return {
            label: 'Output Type',
            value: outputTypeLabel,
        };
    },

    coinbase_extra: (operation) => {
        if (operation.output_type !== OutputType.Coinbase || !operation.coinbase_extra) return null;
        return {
            label: 'Coinbase Extra',
            value: operation.coinbase_extra,
        };
    },
};

// ============================================================================
// Main Entry Building Functions
// ============================================================================

export function getTransactionListEntries(transaction: WalletTransaction): StatusListEntry[] {
    const entries: StatusListEntry[] = [];

    // Process fields in the defined display order
    for (const fieldKey of TRANSACTION_DISPLAY_ORDER) {
        const handler = transactionFieldHandlers[fieldKey];
        if (!handler) continue;

        const result = handler(transaction);
        if (!result) continue;

        const { value, label, ...rest } = result;
        entries.push({
            label: label || capitalizeKey(fieldKey),
            value,
            ...rest,
        });
    }

    return entries;
}

export function getOperationDetails(operation: WalletDetails, index: number): StatusListEntry[] {
    const entries: StatusListEntry[] = [];

    // Process fields in the defined display order
    for (const fieldKey of OPERATION_DISPLAY_ORDER) {
        const handler = operationFieldHandlers[fieldKey];
        if (!handler) continue;

        const result = handler(operation, index);
        if (!result) continue;

        const { value, label, ...rest } = result;
        entries.push({
            label: label || capitalizeKey(fieldKey),
            value,
            ...rest,
        });
    }

    return entries;
}

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
    'claimed_recipient_address_emoji',
    'claimed_sender_address',
    'claimed_sender_address_emoji',
    'memo',
];

const OUTPUT_DISPLAY_ORDER = ['confirmed_height', 'status', 'output_type', 'coinbase_extra'];

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
        return {
            label: 'Amount',
            value: (
                <>
                    {transaction.is_negative ? '-' : '+'}
                    {formatNumber(Number(transaction.transaction_balance), balancePreset)}
                    <span>{` XTM`}</span>
                </>
            ),
            valueRight: `${formatNumber(Number(transaction.transaction_balance), FormatPreset.DECIMAL_COMPACT)} µXTM`,
        };
    },

    eth_destination_address: (transaction) => {
        const ethAddress = transaction.operations[0]?.claimed_recipient_address;
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

    memo: (transaction) => {
        const memoOperation = transaction.operations.find((op) => op.memo_parsed);
        if (!memoOperation?.memo_parsed) return null;

        return {
            label: 'Memo',
            value: memoOperation.memo_parsed,
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

    claimed_recipient_address: (operation) => ({
        label: 'Recipient Address',
        value: operation.claimed_recipient_address,
    }),

    claimed_recipient_address_emoji: (operation) => {
        if (!operation.claimed_recipient_address_emoji) return null;
        return {
            label: 'Recipient Address (Emoji)',
            value: <EmojiAddressWrapper>{operation.claimed_recipient_address_emoji}</EmojiAddressWrapper>,
        };
    },

    claimed_sender_address: (operation) => ({
        label: 'Sender Address',
        value: operation.claimed_sender_address,
    }),

    claimed_sender_address_emoji: (operation) => {
        if (!operation.claimed_sender_address_emoji) return null;
        return {
            label: 'Sender Address (Emoji)',
            value: <EmojiAddressWrapper>{operation.claimed_sender_address_emoji}</EmojiAddressWrapper>,
        };
    },

    memo: (operation) => {
        if (!operation.memo_parsed) return null;
        return {
            label: 'Memo',
            value: operation.memo_parsed,
        };
    },
};

// ============================================================================
// Field Value Handlers - Output Level
// ============================================================================

type OutputFieldHandler = (
    outputDetails: NonNullable<WalletDetails['recieved_output_details']>
) => (Partial<StatusListEntry> & { value: ReactNode }) | null;

const outputFieldHandlers: Record<string, OutputFieldHandler> = {
    confirmed_height: (outputDetails) => {
        if (!outputDetails.confirmed_height) return null;
        return {
            label: 'Confirmed Height',
            value: outputDetails.confirmed_height.toString(),
        };
    },

    status: (outputDetails) => ({
        label: 'Status',
        value: outputDetails.status,
    }),

    output_type: (outputDetails) => {
        const outputTypeLabel = OutputType[outputDetails.output_type] || 'Unknown';
        return {
            label: 'Output Type',
            value: outputTypeLabel,
        };
    },

    coinbase_extra: (outputDetails) => {
        if (outputDetails.output_type !== OutputType.Coinbase || !outputDetails.coinbase_extra) return null;
        return {
            label: 'Coinbase Extra',
            value: outputDetails.coinbase_extra,
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

export function getOutputDetails(
    outputDetails: NonNullable<WalletDetails['recieved_output_details']>
): StatusListEntry[] {
    const entries: StatusListEntry[] = [];

    // Process fields in the defined display order
    for (const fieldKey of OUTPUT_DISPLAY_ORDER) {
        const handler = outputFieldHandlers[fieldKey];
        if (!handler) continue;

        const result = handler(outputDetails);
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

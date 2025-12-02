import i18n from 'i18next';
import { ReactNode } from 'react';
import { formatNumber, FormatPreset } from '@app/utils';
import { StatusListEntry } from '@app/components/transactions/components/StatusList/StatusList.tsx';
import { DisplayedTransaction, TransactionInput, TransactionOutput } from '@app/types/app-status.ts';
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

// ============================================================================
// Main Entry Building Functions
// ============================================================================

export function getTransactionListEntries(transaction: DisplayedTransaction): StatusListEntry[] {
    const entries: StatusListEntry[] = [];

    // Block Height
    entries.push({
        label: 'Block Height',
        value: transaction.blockchain.block_height.toString(),
    });

    // Date
    entries.push({
        label: 'Date',
        value: formatEffectiveDate(transaction.blockchain.timestamp),
    });

    // Direction
    entries.push({
        label: 'Direction',
        value: transaction.direction === 'incoming' ? 'Received' : 'Sent',
    });

    // Source Type
    entries.push({
        label: 'Type',
        value:
            transaction.source === 'coinbase'
                ? 'Mining Reward'
                : transaction.source === 'one_sided'
                  ? 'One-sided Payment'
                  : transaction.source === 'transfer'
                    ? 'Transfer'
                    : 'Transaction',
    });

    // Status
    entries.push({
        label: i18n.t('common:status'),
        value:
            transaction.status === 'confirmed'
                ? 'Confirmed'
                : transaction.status === 'pending'
                  ? 'Pending'
                  : 'Cancelled',
    });

    // Amount
    const isNegative = transaction.direction === 'outgoing';
    const balancePreset = transaction.amount.toString().length > 5 ? FormatPreset.XTM_LONG : FormatPreset.XTM_DECIMALS;
    entries.push({
        label: 'Amount',
        value: (
            <>
                {isNegative ? '-' : '+'}
                {formatNumber(Number(transaction.amount), balancePreset)}
                <span>{` XTM`}</span>
            </>
        ),
        valueRight: `${formatNumber(Number(transaction.amount), FormatPreset.DECIMAL_COMPACT)} µXTM`,
    });

    // Fee (if present)
    if (transaction.fee) {
        entries.push({
            label: 'Fee',
            value: formatMicroTari(transaction.fee.amount),
            valueRight: `${formatNumber(Number(transaction.fee.amount), FormatPreset.DECIMAL_COMPACT)} µXTM`,
        });
    }

    // Confirmations
    if (transaction.blockchain.confirmations > 0) {
        entries.push({
            label: 'Confirmations',
            value: transaction.blockchain.confirmations.toString(),
        });
    }

    // Counterparty Address
    if (transaction.counterparty?.address) {
        entries.push({
            label: transaction.direction === 'incoming' ? 'From Address' : 'To Address',
            value: transaction.counterparty.address,
        });
    }

    // Counterparty Emoji Address
    if (transaction.counterparty?.address_emoji) {
        entries.push({
            label: transaction.direction === 'incoming' ? 'From (Emoji)' : 'To (Emoji)',
            value: <EmojiAddressWrapper>{transaction.counterparty.address_emoji}</EmojiAddressWrapper>,
        });
    }

    // Message/Memo
    if (transaction.message) {
        entries.push({
            label: 'Message',
            value: transaction.message,
        });
    }

    // Bridge transaction details
    if (transaction.bridge_transaction_details) {
        entries.push({
            label: 'Bridge Status',
            value: transaction.bridge_transaction_details.status,
        });

        if (transaction.bridge_transaction_details.transactionHash) {
            entries.push({
                label: 'Transaction Hash',
                value: transaction.bridge_transaction_details.transactionHash,
            });
        }
    }

    // Coinbase extra
    if (transaction.details.coinbase_extra) {
        entries.push({
            label: 'Coinbase Extra',
            value: transaction.details.coinbase_extra,
        });
    }

    return entries;
}

export function getInputDetails(input: TransactionInput): StatusListEntry[] {
    const entries: StatusListEntry[] = [];

    // Amount
    entries.push({
        label: 'Amount',
        value: formatMicroTari(input.amount),
        valueRight: `${formatNumber(Number(input.amount), FormatPreset.DECIMAL_COMPACT)} µXTM`,
    });

    // Output Hash
    entries.push({
        label: 'Output Hash',
        value: input.output_hash,
    });

    // Matched status
    entries.push({
        label: 'Matched',
        value: input.is_matched ? 'Yes' : 'No',
    });

    return entries;
}

export function getOutputDetails(output: TransactionOutput): StatusListEntry[] {
    const entries: StatusListEntry[] = [];

    // Amount
    entries.push({
        label: 'Amount',
        value: formatMicroTari(output.amount),
        valueRight: `${formatNumber(Number(output.amount), FormatPreset.DECIMAL_COMPACT)} µXTM`,
    });

    // Status
    entries.push({
        label: 'Status',
        value: output.status,
    });

    // Output Type
    entries.push({
        label: 'Output Type',
        value: output.output_type,
    });

    // Hash
    entries.push({
        label: 'Hash',
        value: output.hash,
    });

    // Confirmed Height
    if (output.confirmed_height) {
        entries.push({
            label: 'Confirmed Height',
            value: output.confirmed_height.toString(),
        });
    }

    // Is Change
    if (output.is_change) {
        entries.push({
            label: 'Change Output',
            value: 'Yes',
        });
    }

    return entries;
}

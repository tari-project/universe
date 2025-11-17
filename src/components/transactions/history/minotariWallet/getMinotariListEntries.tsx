import i18n from 'i18next';
import { ReactNode } from 'react';
import { formatNumber, FormatPreset } from '@app/utils';
import { StatusListEntry } from '@app/components/transactions/components/StatusList/StatusList.tsx';
import { MinotariWalletTransaction, MinotariWalletDetails, OutputType } from '@app/types/app-status.ts';
import { formatEffectiveDate } from './helpers.ts';
import { EmojiAddressWrapper } from '@app/components/transactions/history/details/styles.ts';

function capitalizeKey(key: string): string {
    return key
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function formatMicroTari(value: number): ReactNode {
    const preset = value.toString().length > 5 ? FormatPreset.XTM_LONG : FormatPreset.XTM_DECIMALS;
    return (
        <>
            {formatNumber(Number(value), preset)}
            <span>{` XTM`}</span>
        </>
    );
}

export function getMinotariListEntries(transaction: MinotariWalletTransaction): StatusListEntry[] {
    const entries: StatusListEntry[] = [];

    // Transaction ID
    entries.push({
        label: i18n.t('wallet:send.transaction-id'),
        value: transaction.id,
    });

    // Account ID
    entries.push({
        label: 'Account ID',
        value: transaction.account_id.toString(),
    });

    // Mined Height (Block Height)
    entries.push({
        label: 'Block Height',
        value: transaction.mined_height.toString(),
    });

    // Effective Date
    entries.push({
        label: 'Date',
        value: formatEffectiveDate(transaction.effective_date),
    });

    // Transaction Balance (renamed to Amount)
    const balancePreset =
        transaction.transaction_balance.toString().length > 5 ? FormatPreset.XTM_LONG : FormatPreset.XTM_DECIMALS;
    entries.push({
        label: 'Amount',
        value: (
            <>
                {transaction.is_negative ? '-' : '+'}
                {formatNumber(Number(transaction.transaction_balance), balancePreset)}
                <span>{` XTM`}</span>
            </>
        ),
        valueRight: `${formatNumber(Number(transaction.transaction_balance), FormatPreset.DECIMAL_COMPACT)} µXTM`,
    });

    // Memo (if exists)
    const memoOperation = transaction.operations.find((op) => op.memo_parsed);
    if (memoOperation?.memo_parsed) {
        entries.push({
            label: 'Memo',
            value: memoOperation.memo_parsed,
        });
    }

    return entries;
}

export function getOperationDetails(operation: MinotariWalletDetails, index: number): StatusListEntry[] {
    const entries: StatusListEntry[] = [];

    // Operation number
    entries.push({
        label: 'Operation',
        value: `#${index + 1}`,
    });

    // Description
    if (operation.description) {
        entries.push({
            label: 'Description',
            value: operation.description,
        });
    }

    // Credit
    if (operation.balance_credit > 0) {
        entries.push({
            label: 'Credit',
            value: formatMicroTari(operation.balance_credit),
            valueRight: `${formatNumber(Number(operation.balance_credit), FormatPreset.DECIMAL_COMPACT)} µXTM`,
        });
    }

    // Debit
    if (operation.balance_debit > 0) {
        entries.push({
            label: 'Debit',
            value: formatMicroTari(operation.balance_debit),
            valueRight: `${formatNumber(Number(operation.balance_debit), FormatPreset.DECIMAL_COMPACT)} µXTM`,
        });
    }

    // Claimed Amount
    if (operation.claimed_amount) {
        entries.push({
            label: 'Claimed Amount',
            value: formatMicroTari(operation.claimed_amount),
            valueRight: `${formatNumber(Number(operation.claimed_amount), FormatPreset.DECIMAL_COMPACT)} µXTM`,
        });
    }

    // Claimed Fee
    if (operation.claimed_fee > 0) {
        entries.push({
            label: 'Claimed Fee',
            value: formatMicroTari(operation.claimed_fee),
            valueRight: `${formatNumber(Number(operation.claimed_fee), FormatPreset.DECIMAL_COMPACT)} µXTM`,
        });
    }

    // Recipient Address
    entries.push({
        label: 'Recipient Address',
        value: operation.claimed_recipient_address,
    });

    // Sender Address
    entries.push({
        label: 'Sender Address',
        value: operation.claimed_sender_address,
    });

    // Memo
    if (operation.memo_parsed) {
        entries.push({
            label: 'Memo',
            value: operation.memo_parsed,
        });
    }

    return entries;
}

export function getOutputDetails(
    outputDetails: NonNullable<MinotariWalletDetails['recieved_output_details']>
): StatusListEntry[] {
    const entries: StatusListEntry[] = [];

    // Confirmed Height
    if (outputDetails.confirmed_height) {
        entries.push({
            label: 'Confirmed Height',
            value: outputDetails.confirmed_height.toString(),
        });
    }

    // Status
    entries.push({
        label: 'Status',
        value: outputDetails.status,
    });

    // Output Type
    const outputTypeLabel = OutputType[outputDetails.output_type] || 'Unknown';
    entries.push({
        label: 'Output Type',
        value: outputTypeLabel,
    });

    // Coinbase Extra (if exists and is coinbase)
    if (outputDetails.output_type === OutputType.Coinbase && outputDetails.coinbase_extra) {
        entries.push({
            label: 'Coinbase Extra',
            value: outputDetails.coinbase_extra,
        });
    }

    return entries;
}

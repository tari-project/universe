import i18n from 'i18next';
import { ReactNode } from 'react';
import { formatNumber, FormatPreset } from '@app/utils';
import { StatusListEntry } from '@app/components/transactions/components/StatusList/StatusList.tsx';
import {
    DisplayedTransaction,
    TransactionInput,
    TransactionOutput,
    TransactionDirection,
    TransactionSource,
    TransactionDisplayStatus,
} from '@app/types/app-status.ts';

import { formatEffectiveDate } from '../helpers';

enum TransactionField {
    Status = 'status',
    Type = 'type',
    Direction = 'direction',
    Amount = 'amount',
    Fee = 'fee',
    Date = 'date',
    BlockHeight = 'blockHeight',
    Confirmations = 'confirmations',
    CounterpartyAddress = 'counterpartyAddress',
    CounterpartyEmoji = 'counterpartyEmoji',
    Message = 'message',
    BridgeStatus = 'bridgeStatus',
    BridgeTransactionHash = 'bridgeTransactionHash',
    CoinbaseExtra = 'coinbaseExtra',
}

const TRANSACTION_FIELD_ORDER: TransactionField[] = [
    TransactionField.Status,
    TransactionField.Type,
    TransactionField.Direction,
    TransactionField.Amount,
    TransactionField.Fee,
    TransactionField.Date,
    TransactionField.BlockHeight,
    TransactionField.Confirmations,
    TransactionField.CounterpartyAddress,
    TransactionField.CounterpartyEmoji,
    TransactionField.Message,
    TransactionField.BridgeStatus,
    TransactionField.BridgeTransactionHash,
    TransactionField.CoinbaseExtra,
];

enum InputField {
    Amount = 'amount',
    OutputHash = 'outputHash',
    Matched = 'matched',
}

const INPUT_FIELD_ORDER: InputField[] = [InputField.Amount, InputField.OutputHash, InputField.Matched];

enum OutputField {
    Amount = 'amount',
    Status = 'status',
    OutputType = 'outputType',
    Hash = 'hash',
    ConfirmedHeight = 'confirmedHeight',
    IsChange = 'isChange',
}

const OUTPUT_FIELD_ORDER: OutputField[] = [
    OutputField.Amount,
    OutputField.Status,
    OutputField.OutputType,
    OutputField.Hash,
    OutputField.ConfirmedHeight,
    OutputField.IsChange,
];

interface OrderedEntry extends StatusListEntry {
    field: TransactionField | InputField | OutputField;
}

function sortByFieldOrder<T>(entries: OrderedEntry[], fieldOrder: T[]): StatusListEntry[] {
    return entries
        .sort((a, b) => {
            const indexA = fieldOrder.indexOf(a.field as T);
            const indexB = fieldOrder.indexOf(b.field as T);
            return indexA - indexB;
        })
        .map(({ field: _, ...entry }) => entry);
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

function getDirectionLabel(direction: TransactionDirection): string {
    switch (direction) {
        case TransactionDirection.Incoming:
            return 'Received';
        case TransactionDirection.Outgoing:
            return 'Sent';
        default:
            return direction;
    }
}

function getSourceLabel(source: TransactionSource): string {
    switch (source) {
        case TransactionSource.Coinbase:
            return 'Mining Reward';
        case TransactionSource.OneSided:
            return 'One-sided Payment';
        case TransactionSource.Transfer:
            return 'Transfer';
        case TransactionSource.Unknown:
        default:
            return 'Transaction';
    }
}

function getStatusLabel(status: TransactionDisplayStatus): string {
    switch (status) {
        case TransactionDisplayStatus.Pending:
            return 'Pending';
        case TransactionDisplayStatus.Unconfirmed:
            return 'Unconfirmed';
        case TransactionDisplayStatus.Confirmed:
            return 'Confirmed';
        case TransactionDisplayStatus.Cancelled:
            return 'Cancelled';
        case TransactionDisplayStatus.Reorganized:
            return 'Reorganized';
        case TransactionDisplayStatus.Rejected:
            return 'Rejected';
        default:
            return status;
    }
}

export function getTransactionListEntries(transaction: DisplayedTransaction): StatusListEntry[] {
    const entries: OrderedEntry[] = [];

    entries.push({
        field: TransactionField.BlockHeight,
        label: 'Block Height',
        value: transaction.blockchain.block_height.toString(),
    });

    entries.push({
        field: TransactionField.Date,
        label: 'Date',
        value: formatEffectiveDate(transaction.blockchain.timestamp),
    });

    entries.push({
        field: TransactionField.Direction,
        label: 'Direction',
        value: getDirectionLabel(transaction.direction),
    });

    entries.push({
        field: TransactionField.Type,
        label: 'Type',
        value: getSourceLabel(transaction.source),
    });

    entries.push({
        field: TransactionField.Status,
        label: i18n.t('common:status'),
        value: getStatusLabel(transaction.status),
    });

    const isNegative = transaction.direction === TransactionDirection.Outgoing;
    const balancePreset = transaction.amount.toString().length > 5 ? FormatPreset.XTM_LONG : FormatPreset.XTM_DECIMALS;
    entries.push({
        field: TransactionField.Amount,
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

    if (transaction.fee) {
        entries.push({
            field: TransactionField.Fee,
            label: 'Fee',
            value: formatMicroTari(transaction.fee.amount),
            valueRight: `${formatNumber(Number(transaction.fee.amount), FormatPreset.DECIMAL_COMPACT)} µXTM`,
        });
    }

    if (transaction.blockchain.confirmations > 0) {
        entries.push({
            field: TransactionField.Confirmations,
            label: 'Confirmations',
            value: transaction.blockchain.confirmations.toString(),
        });
    }

    if (transaction.counterparty) {
        entries.push({
            field: TransactionField.CounterpartyAddress,
            label: transaction.direction === TransactionDirection.Incoming ? 'From Address' : 'To Address',
            value: transaction.counterparty,
        });
    }

    if (transaction.message) {
        entries.push({
            field: TransactionField.Message,
            label: 'Message',
            value: transaction.message,
        });
    }

    if (transaction.bridge_transaction_details) {
        entries.push({
            field: TransactionField.BridgeStatus,
            label: 'Bridge Status',
            value: transaction.bridge_transaction_details.status,
        });

        if (transaction.bridge_transaction_details.transactionHash) {
            entries.push({
                field: TransactionField.BridgeTransactionHash,
                label: 'Transaction Hash',
                value: transaction.bridge_transaction_details.transactionHash,
            });
        }
    }

    if (transaction.details.coinbase_extra) {
        entries.push({
            field: TransactionField.CoinbaseExtra,
            label: 'Coinbase Extra',
            value: transaction.details.coinbase_extra,
        });
    }

    return sortByFieldOrder(entries, TRANSACTION_FIELD_ORDER);
}

export function getInputDetails(input: TransactionInput): StatusListEntry[] {
    const entries: OrderedEntry[] = [];

    entries.push({
        field: InputField.Amount,
        label: 'Amount',
        value: formatMicroTari(input.amount),
        valueRight: `${formatNumber(Number(input.amount), FormatPreset.DECIMAL_COMPACT)} µXTM`,
    });

    entries.push({
        field: InputField.OutputHash,
        label: 'Output Hash',
        value: input.output_hash,
    });

    entries.push({
        field: InputField.Matched,
        label: 'Matched',
        value: input.is_matched ? 'Yes' : 'No',
    });

    return sortByFieldOrder(entries, INPUT_FIELD_ORDER);
}

export function getOutputDetails(output: TransactionOutput): StatusListEntry[] {
    const entries: OrderedEntry[] = [];

    entries.push({
        field: OutputField.Amount,
        label: 'Amount',
        value: formatMicroTari(output.amount),
        valueRight: `${formatNumber(Number(output.amount), FormatPreset.DECIMAL_COMPACT)} µXTM`,
    });

    entries.push({
        field: OutputField.Status,
        label: 'Status',
        value: output.status,
    });

    entries.push({
        field: OutputField.OutputType,
        label: 'Output Type',
        value: output.output_type,
    });

    entries.push({
        field: OutputField.Hash,
        label: 'Hash',
        value: output.hash,
    });

    if (output.confirmed_height) {
        entries.push({
            field: OutputField.ConfirmedHeight,
            label: 'Confirmed Height',
            value: output.confirmed_height.toString(),
        });
    }

    if (output.is_change) {
        entries.push({
            field: OutputField.IsChange,
            label: 'Change Output',
            value: 'Yes',
        });
    }

    return sortByFieldOrder(entries, OUTPUT_FIELD_ORDER);
}

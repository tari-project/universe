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
}

const INPUT_FIELD_ORDER: InputField[] = [InputField.Amount, InputField.OutputHash];

enum OutputField {
    Amount = 'amount',
    Status = 'status',
    OutputType = 'outputType',
    Hash = 'hash',
    IsChange = 'isChange',
}

const OUTPUT_FIELD_ORDER: OutputField[] = [
    OutputField.Amount,
    OutputField.Status,
    OutputField.OutputType,
    OutputField.Hash,
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

/** `FixedHash` and friends arrive as byte arrays over the wire; show them the way the explorer does. */
function toHex(bytes: number[]): string {
    return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
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
            return i18n.t('common:received');
        case TransactionDirection.Outgoing:
            return i18n.t('common:sent');
        default:
            return direction;
    }
}

function getSourceLabel(source: TransactionSource): string {
    switch (source) {
        case TransactionSource.Coinbase:
            return i18n.t('wallet:details.source-coinbase');
        case TransactionSource.OneSided:
            return i18n.t('wallet:details.source-one-sided');
        case TransactionSource.Transfer:
            return i18n.t('wallet:details.source-transfer');
        case TransactionSource.Unknown:
        default:
            return i18n.t('wallet:details.source-unknown');
    }
}

function getStatusLabel(status: TransactionDisplayStatus): string {
    switch (status) {
        case TransactionDisplayStatus.Pending:
            return i18n.t('common:pending');
        case TransactionDisplayStatus.Unconfirmed:
            return i18n.t('wallet:details.status-unconfirmed');
        case TransactionDisplayStatus.Confirmed:
            return i18n.t('wallet:details.status-confirmed');
        case TransactionDisplayStatus.Cancelled:
            return i18n.t('wallet:details.status-cancelled');
        case TransactionDisplayStatus.Reorganized:
            return i18n.t('wallet:details.status-reorganized');
        case TransactionDisplayStatus.Rejected:
            return i18n.t('wallet:details.status-rejected');
        case TransactionDisplayStatus.Locked:
            return i18n.t('wallet:details.status-locked');
        default:
            return status;
    }
}

export function getTransactionListEntries(transaction: DisplayedTransaction): StatusListEntry[] {
    const entries: OrderedEntry[] = [];

    entries.push({
        field: TransactionField.BlockHeight,
        label: i18n.t('wallet:details.block-height'),
        value: transaction.blockchain.block_height.toString(),
    });

    entries.push({
        field: TransactionField.Date,
        label: i18n.t('wallet:details.date'),
        value: formatEffectiveDate(transaction.blockchain.timestamp),
    });

    entries.push({
        field: TransactionField.Direction,
        label: i18n.t('wallet:details.direction'),
        value: getDirectionLabel(transaction.direction),
    });

    entries.push({
        field: TransactionField.Type,
        label: i18n.t('wallet:details.type'),
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
        label: i18n.t('wallet:details.amount'),
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
            label: i18n.t('wallet:details.fee'),
            value: formatMicroTari(transaction.fee.amount),
            valueRight: `${formatNumber(Number(transaction.fee.amount), FormatPreset.DECIMAL_COMPACT)} µXTM`,
        });
    }

    if (transaction.blockchain.confirmations > 0) {
        entries.push({
            field: TransactionField.Confirmations,
            label: i18n.t('wallet:details.confirmations'),
            value: transaction.blockchain.confirmations.toString(),
        });
    }

    if (transaction.counterparty) {
        entries.push({
            field: TransactionField.CounterpartyAddress,
            label:
                transaction.direction === TransactionDirection.Incoming
                    ? i18n.t('wallet:details.from-address')
                    : i18n.t('wallet:details.to-address'),
            value: transaction.counterparty,
        });
    }

    if (transaction.message) {
        entries.push({
            field: TransactionField.Message,
            label: i18n.t('wallet:details.message'),
            value: transaction.message,
        });
    }

    if (transaction.bridge_transaction_details) {
        entries.push({
            field: TransactionField.BridgeStatus,
            label: i18n.t('wallet:details.bridge-status'),
            value: transaction.bridge_transaction_details.status,
        });

        if (transaction.bridge_transaction_details.transactionHash) {
            entries.push({
                field: TransactionField.BridgeTransactionHash,
                label: i18n.t('wallet:details.transaction-hash'),
                value: transaction.bridge_transaction_details.transactionHash,
            });
        }
    }

    if (transaction.details.coinbase_extra) {
        entries.push({
            field: TransactionField.CoinbaseExtra,
            label: i18n.t('wallet:details.coinbase-extra'),
            value: toHex(transaction.details.coinbase_extra.inner),
        });
    }

    return sortByFieldOrder(entries, TRANSACTION_FIELD_ORDER);
}

export function getInputDetails(input: TransactionInput): StatusListEntry[] {
    const entries: OrderedEntry[] = [];

    entries.push({
        field: InputField.Amount,
        label: i18n.t('wallet:details.amount'),
        value: formatMicroTari(input.amount),
        valueRight: `${formatNumber(Number(input.amount), FormatPreset.DECIMAL_COMPACT)} µXTM`,
    });

    entries.push({
        field: InputField.OutputHash,
        label: i18n.t('wallet:details.output-hash'),
        value: toHex(input.output_hash),
    });

    return sortByFieldOrder(entries, INPUT_FIELD_ORDER);
}

export function getOutputDetails(output: TransactionOutput): StatusListEntry[] {
    const entries: OrderedEntry[] = [];

    entries.push({
        field: OutputField.Amount,
        label: i18n.t('wallet:details.amount'),
        value: formatMicroTari(output.amount),
        valueRight: `${formatNumber(Number(output.amount), FormatPreset.DECIMAL_COMPACT)} µXTM`,
    });

    entries.push({
        field: OutputField.Status,
        label: i18n.t('wallet:details.status'),
        value: output.status,
    });

    entries.push({
        field: OutputField.OutputType,
        label: i18n.t('wallet:details.output-type'),
        value: output.output_type.toString(),
    });

    entries.push({
        field: OutputField.Hash,
        label: i18n.t('wallet:details.hash'),
        value: toHex(output.hash),
    });

    if (output.is_change) {
        entries.push({
            field: OutputField.IsChange,
            label: i18n.t('wallet:details.change-output'),
            value: i18n.t('wallet:details.yes'),
        });
    }

    return sortByFieldOrder(entries, OUTPUT_FIELD_ORDER);
}

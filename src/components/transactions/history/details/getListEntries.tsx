import i18n from 'i18next';
import { TransactionInfo } from '@app/types/app-status.ts';
import { formatTimeStamp, isTransactionInfo } from '@app/components/transactions/history/helpers.ts';
import { ReactNode } from 'react';
import { formatNumber, FormatPreset } from '@app/utils';
import { StatusListEntry } from '@app/components/transactions/components/StatusList/StatusList.tsx';
import { Network } from '@app/utils/network.ts';
import { BackendBridgeTransaction, useMiningStore } from '@app/store';
import { getTxStatusTitleKey, getTxTitle } from '@app/utils/getTxStatus.ts';

type TransactionKey = keyof TransactionInfo;
type TransactionEntry = {
    [K in keyof TransactionInfo]-?: {
        key: K;
        value: TransactionInfo[K];
    };
}[keyof TransactionInfo];

type BridgeTransactionKey = keyof BackendBridgeTransaction;
type BridgeTransactionEntry = {
    [K in keyof BackendBridgeTransaction]-?: {
        key: K;
        value: BackendBridgeTransaction[K];
    };
}[keyof BackendBridgeTransaction];

const network = useMiningStore.getState().network;
const explorerURL = `https://${network === Network.Esmeralda ? 'textexplore-esmeralda' : network === Network.NextNet ? 'explore-nextnet' : 'explore'}.tari.com`;

const HIDDEN_KEYS = ['direction', 'excess_sig', 'tx_id'];
const BRIDGE_HIDDEN_KEYS = ['paymentId'];

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

function parseTransactionValues({
    key,
    value,
    transaction,
}: TransactionEntry & { transaction: TransactionInfo }): Partial<StatusListEntry> & {
    value: ReactNode;
} {
    const rest: Partial<StatusListEntry> = {};
    if (key === 'timestamp') {
        return { value: formatTimeStamp(value) };
    }
    if (key === 'payment_id') {
        return { value: getTxTitle(transaction) };
    }
    if (key === 'status') {
        const tKey = getTxStatusTitleKey(transaction);
        return { value: i18n.t(`common:${tKey}`), valueRight: value };
    }
    if (key === 'amount') {
        const preset = value.toString().length > 5 ? FormatPreset.XTM_LONG : FormatPreset.XTM_DECIMALS;
        const valueMarkup = (
            <>
                {formatNumber(value, preset)}
                <span>{` XTM`}</span>
            </>
        );
        return {
            value: valueMarkup,
            valueRight: `${formatNumber(value, FormatPreset.DECIMAL_COMPACT)} µT`,
        };
    }

    if (key === 'mined_in_block_height' && value) {
        rest['externalLink'] = `${explorerURL}/blocks/${value}`;
    }

    return { value, ...rest };
}

function parseBridgeTransactionValues({
    key,
    value,
    transaction,
}: BridgeTransactionEntry & { transaction: BackendBridgeTransaction }): Partial<StatusListEntry> & {
    value: ReactNode;
} {
    const rest: Partial<StatusListEntry> = {};
    if (key === 'status') {
        const tKey = getTxStatusTitleKey(transaction);
        return { value: i18n.t(`common:${tKey}`), valueRight: value };
    }
    if (key === 'tokenAmount') {
        const preset = value.toString().length > 5 ? FormatPreset.XTM_LONG : FormatPreset.XTM_DECIMALS;
        return {
            value: formatNumber(Number(value), preset),
            valueRight: `${formatNumber(Number(value), FormatPreset.DECIMAL_COMPACT)} µT`,
        };
    }
    if (key === 'amountAfterFee') {
        const preset = value.toString().length > 5 ? FormatPreset.XTM_LONG : FormatPreset.XTM_DECIMALS;
        return {
            value: formatNumber(Number(value), preset),
            valueRight: `${formatNumber(Number(value), FormatPreset.DECIMAL_COMPACT)} µT`,
        };
    }
    if (key === 'feeAmount') {
        const preset = value.toString().length > 5 ? FormatPreset.XTM_LONG : FormatPreset.XTM_DECIMALS;
        return {
            value: formatNumber(Number(value), preset),
            valueRight: `${formatNumber(Number(value), FormatPreset.DECIMAL_COMPACT)} µT`,
        };
    }

    if (key === 'destinationAddress') {
        return { label: 'Destination address [ ETH ]', value: transaction.destinationAddress };
    }

    return { value, ...rest };
}

export function getListEntries(item: TransactionInfo | BackendBridgeTransaction, showHidden = false) {
    const hiddenKeys = isTransactionInfo(item) ? HIDDEN_KEYS : BRIDGE_HIDDEN_KEYS;
    const entries = Object.entries(item).filter(([key]) => showHidden || !hiddenKeys.includes(key));
    return entries.map(([key, _value]) => {
        if (isTransactionInfo(item)) {
            const { value, ...rest } = parseTransactionValues({
                key: key as TransactionKey,
                value: _value,
                transaction: item,
            });
            return {
                label: getLabel(key),
                value,
                ...rest,
            };
        } else {
            const { value, ...rest } = parseBridgeTransactionValues({
                key: key as BridgeTransactionKey,
                value: _value,
                transaction: item,
            });
            return {
                label: getLabel(key),
                value,
                ...rest,
            };
        }
    });
}

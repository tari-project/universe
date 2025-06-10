import i18n from 'i18next';
import { formatTimeStamp } from '@app/components/transactions/history/helpers.ts';
import { ReactNode } from 'react';
import { formatNumber, FormatPreset } from '@app/utils';
import { StatusListEntry } from '@app/components/transactions/components/StatusList/StatusList.tsx';
import { getExplorerUrl, Network } from '@app/utils/network.ts';
import { useMiningStore } from '@app/store';
import { getTxStatusTitleKey, getTxTitle } from '@app/utils/getTxStatus.ts';
import { TransactionDetailsItem } from '@app/types/transactions.ts';
import { EmojiAddressWrapper } from '@app/components/transactions/history/details/styles.ts';

type Key = keyof TransactionDetailsItem;
type Entry = {
    [K in keyof TransactionDetailsItem]-?: {
        key: K;
        value: TransactionDetailsItem[K];
    };
}[keyof TransactionDetailsItem];

const network = useMiningStore.getState().network;

const HIDDEN_KEYS = ['direction', 'excess_sig', 'tx_id'];

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

function parseValues({
    key,
    value,
    transaction,
}: Entry & { transaction: TransactionDetailsItem }): Partial<StatusListEntry> & { value: ReactNode } {
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
    if (key === 'amount' || key === 'fee') {
        const preset = value.toString().length > 5 ? FormatPreset.XTM_LONG : FormatPreset.XTM_DECIMALS;
        const valueMarkup = (
            <>
                {formatNumber(value, preset)}
                <span>{` XTM`}</span>
            </>
        );
        return {
            value: valueMarkup,
            valueRight: `${formatNumber(value, FormatPreset.DECIMAL_COMPACT)} µXTM`,
        };
    }
    if (key === 'mined_in_block_height' && value) {
        const explorerURL = getExplorerUrl(network === Network.MainNet);
        rest['externalLink'] = `${explorerURL}/blocks/${value}`;
    }

    if (key === `dest_address_emoji`) {
        return { value: <EmojiAddressWrapper>{value}</EmojiAddressWrapper> };
    }

    return { value, ...rest };
}

export function getListEntries(item: TransactionDetailsItem, showHidden = false) {
    const entries = Object.entries(item).filter(([key]) => showHidden || !HIDDEN_KEYS.includes(key));
    return entries.map(([key, _value]) => {
        const { value, ...rest } = parseValues({ key: key as Key, value: _value, transaction: item });
        return {
            label: getLabel(key),
            value,
            ...rest,
        };
    });
}

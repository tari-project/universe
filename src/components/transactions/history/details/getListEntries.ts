import i18n from 'i18next';
import { TransactionInfo } from '@app/types/app-status.ts';
import { formatTimeStamp } from '@app/components/transactions/history/helpers.ts';
import { ReactNode } from 'react';
import { formatNumber, FormatPreset } from '@app/utils';
import { StatusListEntry } from '@app/components/transactions/components/StatusList/StatusList.tsx';
import { Network } from '@app/utils/network.ts';
import { useMiningStore } from '@app/store';
import { getTxStatusString } from '@app/utils/getTxStatus.ts';

type Key = keyof TransactionInfo;
type Entry = {
    [K in keyof TransactionInfo]-?: {
        key: K;
        value: TransactionInfo[K];
    };
}[keyof TransactionInfo];

const network = useMiningStore.getState().network;
const explorerURL = `https://${network === Network.Esmeralda ? 'textexplore-esmeralda' : network === Network.NextNet ? 'explore-nextnet' : 'explore'}.tari.com`;

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

function parseValues({ key, value }: Entry): Partial<StatusListEntry> & { value: ReactNode } {
    const rest: Partial<StatusListEntry> = {};
    if (key === 'timestamp') {
        return { value: formatTimeStamp(value) };
    }
    if (key === 'status') {
        return { value: getTxStatusString(value) };
    }
    if (key === 'amount') {
        const preset = value.toString().length > 5 ? FormatPreset.XTM_LONG : FormatPreset.XTM_DECIMALS;
        return {
            value: formatNumber(value, preset),
            valueRight: `${formatNumber(value, FormatPreset.DECIMAL_COMPACT)} µT`,
        };
    }
    if (key === 'mined_in_block_height' && value) {
        rest['externalLink'] = `${explorerURL}/blocks/${value}`;
    }

    return { value, ...rest };
}

export function getListEntries(item: TransactionInfo, showHidden = false) {
    const entries = Object.entries(item).filter(([key]) => showHidden || !HIDDEN_KEYS.includes(key));
    return entries.map(([key, _value]) => {
        const { value, ...rest } = parseValues({ key: key as Key, value: _value });
        return {
            label: getLabel(key),
            value,
            ...rest,
        };
    });
}

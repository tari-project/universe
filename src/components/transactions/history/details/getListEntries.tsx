import i18n from 'i18next';
import { formatTimeStamp } from '@app/components/transactions/history/helpers.ts';
import { ReactNode } from 'react';
import { formatNumber, FormatPreset } from '@app/utils';
import { StatusListEntry } from '@app/components/transactions/components/StatusList/StatusList.tsx';
import { getExplorerUrl, Network } from '@app/utils/network.ts';
import { CombinedBridgeWalletTransaction, useNodeStore, useMiningStore } from '@app/store';
import { getTxStatusTitleKey, getTxTitle } from '@app/utils/getTxStatus.ts';
import { EmojiAddressWrapper } from '@app/components/transactions/history/details/styles.ts';

type CombinedTransactionKey = keyof CombinedBridgeWalletTransaction;

const network = useMiningStore.getState().network;

const MAIN_HIDDEN_KEYS: CombinedTransactionKey[] = ['paymentId'];
const WALLET_DETAILS_HIDDEN_KEYS: (keyof CombinedBridgeWalletTransaction['walletTransactionDetails'])[] = [
    'excessSig',
    'txId',
];
const BRIDGE_DETAILS_HIDDEN_KEYS: (keyof CombinedBridgeWalletTransaction['bridgeTransactionDetails'])[] = [];
const HIDDEN_KEYS: string[] = [...MAIN_HIDDEN_KEYS, ...WALLET_DETAILS_HIDDEN_KEYS, ...BRIDGE_DETAILS_HIDDEN_KEYS];

const keyTranslations: Record<string, string> = {
    sourceAddress: 'wallet:receive.label-address',
    destinationAddress: 'wallet:send.destination-address',
    paymentId: 'wallet:send.transaction-description',
    feeAmount: 'wallet:send.network-fee',
    createdAt: 'Created at',
    tokenAmount: 'wallet:send.label-amount',
    mined_in_block_height: 'Block height',
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
function getPaymentReferenceValue(transaction: CombinedBridgeWalletTransaction): ReactNode {
    if (transaction.walletTransactionDetails.paymentReference) {
        return transaction.walletTransactionDetails.paymentReference;
    }
    const currentBlockHeight = useNodeStore.getState().base_node_status?.block_height;
    if (!transaction.mined_in_block_height || !currentBlockHeight) {
        return i18n.t('common:pending');
    }
    const confirmations = currentBlockHeight - transaction.mined_in_block_height;
    if (confirmations < 5) {
        return i18n.t('common:waiting-for-confirmations', { confirmations, total: 5 });
    }
    return i18n.t('common:not-available');
}

const UNIFIED_DISPLAY_ORDER = [
    'paymentId',
    'paymentReference',
    'txId',
    'tokenAmount',
    'feeAmount',
    'createdAt',

    'mined_in_block_height',
    'status',

    'sourceAddress',
    'destinationAddress',
    'destAddressEmoji', // Emoji address, if available
];

// Helper function to get custom display order for specific transaction types
function getUnifiedDisplayOrder(transaction: CombinedBridgeWalletTransaction): string[] {
    // For bridge transactions, we might want a different order
    if (transaction.bridgeTransactionDetails) {
        return [
            'destinationAddress',
            'sourceAddress',
            'tokenAmount',
            'amountAfterFee',
            'feeAmount',
            'createdAt',
            'mined_in_block_height',
            'transactionHash',
            'status',
            'txId',
        ];
    }

    return UNIFIED_DISPLAY_ORDER;
}

const unifiedValueHandlers: Record<
    string,
    (transaction: CombinedBridgeWalletTransaction) => (Partial<StatusListEntry> & { value: ReactNode }) | null
> = {
    createdAt: (transaction) => ({ value: formatTimeStamp(transaction.createdAt) }),

    paymentId: (transaction) => ({ value: getTxTitle(transaction) }),

    tokenAmount: (transaction) => {
        const preset =
            transaction.tokenAmount.toString().length > 5 ? FormatPreset.XTM_LONG : FormatPreset.XTM_DECIMALS;
        const valueMarkup = (
            <>
                {formatNumber(Number(transaction.tokenAmount), preset)}
                <span>{` XTM`}</span>
            </>
        );
        return {
            value: valueMarkup,
            valueRight: `${formatNumber(Number(transaction.tokenAmount), FormatPreset.DECIMAL_COMPACT)} µXTM`,
        };
    },

    feeAmount: (transaction) => {
        const preset = transaction.feeAmount.toString().length > 5 ? FormatPreset.XTM_LONG : FormatPreset.XTM_DECIMALS;
        const valueMarkup = (
            <>
                {formatNumber(Number(transaction.feeAmount), preset)}
                <span>{` XTM`}</span>
            </>
        );
        return {
            value: valueMarkup,
            valueRight: `${formatNumber(Number(transaction.feeAmount), FormatPreset.DECIMAL_COMPACT)} µXTM`,
        };
    },

    mined_in_block_height: (transaction) => {
        const rest: Partial<StatusListEntry> = {};
        if (transaction.mined_in_block_height) {
            const explorerURL = getExplorerUrl(network === Network.MainNet);
            rest['externalLink'] = `${explorerURL}/blocks/${transaction.mined_in_block_height}`;
        }
        return { value: transaction.mined_in_block_height || 'Pending', ...rest };
    },

    destinationAddress: (transaction) => {
        // Show ETH address if it's a bridge transaction
        if (transaction.bridgeTransactionDetails) {
            return { label: 'Destination address [ ETH ]', value: transaction.destinationAddress };
        }
        return { value: transaction.destinationAddress };
    },

    destAddressEmoji: (transaction) => {
        // Return emoji address if available
        if (transaction.walletTransactionDetails.destAddressEmoji) {
            return {
                label: getLabel('destAddressEmoji'),
                value: (
                    <EmojiAddressWrapper>{transaction.walletTransactionDetails.destAddressEmoji}</EmojiAddressWrapper>
                ),
            };
        }
        return null;
    },

    sourceAddress: (transaction) => ({ value: transaction.sourceAddress }),

    status: (transaction) => {
        const statusKey = getTxStatusTitleKey(transaction);
        if (!statusKey) return null;
        const valueRight = transaction.bridgeTransactionDetails?.status || transaction.walletTransactionDetails.status;

        return {
            label: i18n.t('common:status'),
            value: i18n.t(`common:${statusKey}`),
            valueRight: valueRight.toString(),
        };
    },

    paymentReference: (transaction) => {
        return {
            label: 'Payment Reference',
            value: getPaymentReferenceValue(transaction),
        };
    },

    txId: (transaction) => {
        if (!transaction.walletTransactionDetails.txId) return null;

        return {
            label: i18n.t('wallet:send.transaction-id'),
            value: transaction.walletTransactionDetails.txId.toString(),
        };
    },

    amountAfterFee: (transaction) => {
        const bridgeDetails = transaction.bridgeTransactionDetails;
        if (!bridgeDetails?.amountAfterFee) return null;

        const preset =
            bridgeDetails.amountAfterFee.toString().length > 5 ? FormatPreset.XTM_LONG : FormatPreset.XTM_DECIMALS;
        const valueMarkup = (
            <>
                {formatNumber(Number(bridgeDetails.amountAfterFee), preset)}
                <span>{` XTM`}</span>
            </>
        );
        return {
            label: 'Amount after fee',
            value: valueMarkup,
            valueRight: `${formatNumber(Number(bridgeDetails.amountAfterFee), FormatPreset.DECIMAL_COMPACT)} µXTM`,
        };
    },

    transactionHash: (transaction) => {
        const bridgeDetails = transaction.bridgeTransactionDetails;
        if (!bridgeDetails?.transactionHash) return null;

        return {
            label: 'Transaction Hash',
            value: bridgeDetails.transactionHash,
        };
    },

    // Skip nested objects in main processing
    walletTransactionDetails: () => null,
    bridgeTransactionDetails: () => null,
};

function shouldShowField(key: string, showHidden: boolean): boolean {
    return !(!showHidden && HIDDEN_KEYS.includes(key));
}

function parseUnifiedTransactionValue(
    key: string,
    transaction: CombinedBridgeWalletTransaction,
    showHidden = false
): (Partial<StatusListEntry> & { value: ReactNode }) | null {
    // Check visibility first
    if (!shouldShowField(key, showHidden)) return null;

    // Use unified handler if available
    const handler = unifiedValueHandlers[key];
    if (handler) {
        return handler(transaction);
    }

    // Default fallback for unhandled keys - get from main transaction object
    const value = transaction[key];
    if (value === undefined) return null;

    return { value: String(value) };
}

export function getListEntries(item: CombinedBridgeWalletTransaction, showHidden = false): StatusListEntry[] {
    const displayOrder = getUnifiedDisplayOrder(item);

    const unifiedEntries: StatusListEntry[] = [];

    for (const key of displayOrder) {
        const result = parseUnifiedTransactionValue(key, item, showHidden);

        // Skip null results (e.g., missing bridge details for regular transactions, or hidden fields)
        if (!result) continue;

        const { value, label, ...rest } = result;
        unifiedEntries.push({
            label: label || getLabel(key),
            value,
            ...rest,
        });
    }

    return unifiedEntries;
}

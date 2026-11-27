import {
    OpenAPI,
    WrapTokenService,
    MineToExchangeService,
    MineToExchangeConfigDTO,
} from '@tari-project/wxtm-bridge-backend-api';
import { useConfigBEInMemoryStore } from '../useAppConfigStore';
import { BackendBridgeTransaction, useWalletStore } from '../useWalletStore';
import { invoke } from '@tauri-apps/api/core';
import { setExchangeETHAddress } from '@app/store/actions/walletStoreActions.ts';

// The bridge lists a wrap by this display reference, never by its paymentId: the first 16 hex
// characters of sha256('ootle-wrap-reference:' + paymentId), as the backend derives it.
export const bridgeReference = async (paymentId: string): Promise<string> => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`ootle-wrap-reference:${paymentId}`));
    return Array.from(new Uint8Array(digest, 0, 8), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const PAGE_LIMIT = 100;
// Stops a misbehaving backend from keeping the paging loop going.
const MAX_PAGES = 50;

export const fetchBridgeTransactionsHistory = async (
    tari_address_base58: string
): Promise<BackendBridgeTransaction[]> => {
    const baseUrl = useConfigBEInMemoryStore.getState().bridge_backend_api_url;
    if (baseUrl?.includes('env var not defined') || !tari_address_base58?.length) return [];
    OpenAPI.BASE = baseUrl;
    try {
        const transactions: BackendBridgeTransaction[] = [];
        for (let page = 0; page < MAX_PAGES; page++) {
            const response = await WrapTokenService.getUserTransactions(
                tari_address_base58,
                PAGE_LIMIT,
                transactions.length
            );
            transactions.push(...response.transactions);
            const total = Number(response.total);
            if (!response.transactions.length || !Number.isFinite(total) || transactions.length >= total) break;
        }
        useWalletStore.setState((c) => ({
            ...c,
            bridge_transactions: transactions,
        }));
        return transactions;
    } catch (error) {
        console.error('Could not fetch bridge transactions history: ', error);
        throw new Error(`Could not fetch bridge transactions history: ${error}`);
    }
};

export const fetchBridgeColdWalletAddress = async () => {
    const baseUrl = useConfigBEInMemoryStore.getState().bridge_backend_api_url;
    if (baseUrl?.includes('env var not defined')) return;
    try {
        OpenAPI.BASE = baseUrl;
        await WrapTokenService.getWrapTokenParams().then((response) => {
            console.info('Bridge safe wallet address fetched successfully:', response);
            useWalletStore.setState({
                cold_wallet_address: response.coldWalletAddress,
            });
        });
    } catch (error) {
        console.error('Could not get bridge safe wallet address: ', error);
    }
};

/**
 * Converts an Ethereum address to a Tari address using the bridge backend API.
 *
 * Sends a request to the backend service to convert the provided Ethereum address into a Tari address and payment ID.
 *
 * Then encodes the Tari address with the payment ID to get the final Tari address.
 *
 * Updates the wallet store with the new exchange Ethereum address.
 *
 * @param ethAddress - The Ethereum address to convert.
 * @param exchangeId - The ID of the exchange for which the conversion is being done.
 * @returns A promise that resolves to the converted Tari address.
 */

export const convertEthAddressToTariAddress = async (ethAddress: string, exchangeId: string): Promise<string> => {
    const baseUrl = useConfigBEInMemoryStore.getState().bridge_backend_api_url;

    try {
        OpenAPI.BASE = baseUrl;
        const payload: MineToExchangeConfigDTO = {
            toAddress: ethAddress,
        };

        const { paymentId, walletAddress } = await MineToExchangeService.config(payload);
        const encodedTariAddress = await invoke('encode_payment_id_to_address', {
            tariAddress: walletAddress,
            paymentId: paymentId,
        });
        await invoke('save_wxtm_address', {
            address: ethAddress,
            exchangeId: exchangeId,
        });

        setExchangeETHAddress(ethAddress, exchangeId);
        return encodedTariAddress;
    } catch (error) {
        console.error('Could not convert ETH address to Tari address: ', error);
        throw new Error(`Could not convert ETH address to Tari address: ${error}`);
    }
};

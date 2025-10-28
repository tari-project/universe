import {
    OpenAPI,
    WrapTokenService,
    MineToExchangeService,
    MineToExchangeConfigDTO,
} from '@tari-project/wxtm-bridge-backend-api';
import { useConfigBEInMemoryStore } from '../useAppConfigStore';
import { BackendBridgeTransaction, useWalletStore } from '../useWalletStore';
import { invoke } from '@tauri-apps/api/core';
import { setExchangeETHAdress } from '@app/store/actions/walletStoreActions.ts';

export const fetchBridgeTransactionsHistory = async (
    tari_address_base58: string
): Promise<BackendBridgeTransaction[]> => {
    const baseUrl = useConfigBEInMemoryStore.getState().bridge_backend_api_url;
    if (baseUrl?.includes('env var not defined')) return [];
    OpenAPI.BASE = baseUrl;
    return await WrapTokenService.getUserTransactions(tari_address_base58)
        .then((response) => {
            console.info(
                '========================================================================================================================'
            );
            console.info('BRIDGE TXS = ');
            console.info(response.transactions);
            console.info(
                '========================================================================================================================'
            );
            return response.transactions;
        })
        .catch((error) => {
            console.error('Could not fetch bridge transactions history: ', error);
            throw new Error(`Could not fetch bridge transactions history: ${error}`);
        });
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
        console.info('Converted ETH address to Tari address:', encodedTariAddress);
        await invoke('save_wxtm_address', {
            address: ethAddress,
            exchangeId: exchangeId,
        });

        setExchangeETHAdress(ethAddress, exchangeId);
        return encodedTariAddress;
    } catch (error) {
        console.error('Could not convert ETH address to Tari address: ', error);
        throw new Error(`Could not convert ETH address to Tari address: ${error}`);
    }
};

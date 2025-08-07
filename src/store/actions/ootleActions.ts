import { invoke } from '@tauri-apps/api/core';
import {
    AccountsCreateFreeTestCoinsRequest,
    AccountsCreateFreeTestCoinsResponse,
    AccountsCreateRequest,
    AccountsCreateResponse,
    AccountsGetBalancesRequest,
    AccountsGetBalancesResponse,
    AccountsListRequest,
    AccountsListResponse,
} from '@tari-project/typescript-bindings';
import { setError } from './appStateStoreActions';

export const ootleListAccounts = async (request: AccountsListRequest): Promise<AccountsListResponse | undefined> => {
    try {
        return await invoke('ootle_list_accounts', { request });
    } catch (e) {
        const message = 'Could not list Ootle accounts';
        console.error(message, e);
        setError(message);
    }
};

export const ootleCreateAccount = async (
    request: AccountsCreateRequest
): Promise<AccountsCreateResponse | undefined> => {
    try {
        return await invoke('ootle_create_account', { request });
    } catch (e) {
        const message = 'Could not create Ootle account';
        console.error(message, e);
        setError(message);
    }
};

export const ootleCreateDefaultAccount = async (
    request: AccountsCreateFreeTestCoinsRequest
): Promise<AccountsCreateFreeTestCoinsResponse | undefined> => {
    try {
        return await invoke('ootle_create_free_test_coins', { request });
    } catch (e) {
        const message = 'Could not create Default Ootle account';
        console.error(message, e);
        setError(message);
    }
};

export const ootleGetBalances = async (
    request: AccountsGetBalancesRequest
): Promise<AccountsGetBalancesResponse | undefined> => {
    try {
        return await invoke('ootle_get_balances', { request });
    } catch (e) {
        const message = 'Could not get Ootle balances';
        console.error(message, e);
        setError(message);
    }
};

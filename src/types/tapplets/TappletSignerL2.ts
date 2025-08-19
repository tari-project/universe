import { WalletDaemonClient, transports } from '@tari-project/wallet_jrpc_client';
import { TappletPermissions } from '@tari-project/tari-permissions';
import {
    AccountData,
    GetTransactionResultResponse,
    ListSubstatesResponse,
    SubmitTransactionRequest,
    SubmitTransactionResponse,
    Substate,
    TemplateDefinition,
    VaultBalances,
    convertStringToTransactionStatus,
    createNftAddressFromResource,
    ListSubstatesRequest,
    substateIdToString,
} from '@tari-project/tarijs-types';
import {
    AccountGetDefaultRequest,
    AccountGetResponse,
    AccountSetDefaultResponse,
    AccountsGetBalancesResponse,
    AccountsListRequest,
    AccountsListResponse,
    BalanceEntry,
    ComponentAccessRules,
    ConfidentialViewVaultBalanceRequest,
    Instruction,
    KeyBranch,
    ListAccountNftRequest,
    ListAccountNftResponse,
    PublishTemplateRequest,
    PublishTemplateResponse,
    stringToSubstateId,
    SubstatesGetResponse,
    SubstatesListRequest,
    TransactionSubmitRequest,
    WalletGetInfoResponse,
} from '@tari-project/typescript-bindings';
import { TariSigner } from '@tari-project/tari-signer';
import { invoke } from '@tauri-apps/api/core';
import { TappletSignerParams } from './tapplet.types';

export type TappletSignerMethod = Exclude<keyof TappletSignerL2, 'runOne'>;

export interface ListAccountNftFromBalancesRequest {
    balances: BalanceEntry[];
}

interface OotleAccount extends AccountData {
    account_name: string;
}

export class IPCRpcTransport implements transports.RpcTransport {
    async sendRequest<T>(request: transports.RpcRequest, _: transports.RpcTransportOptions): Promise<T> {
        console.warn('🕵🕵🕵 [SIGNER] sendRequest', request);
        const res = await invoke('ootle_make_json_rpc_request', {
            method: request.method,
            params: JSON.stringify(request.params),
        });
        console.warn('🕵🕵🕵 [SIGNER] sendRequest response', res);
        return res;
    }
}

export class TappletSignerL2 implements TariSigner {
    public signerName = 'TappletSignerL2';
    id: string;
    params: TappletSignerParams;
    client: WalletDaemonClient;
    isProviderConnected: boolean;

    constructor(params: TappletSignerParams, connection: WalletDaemonClient) {
        this.params = params;
        this.client = connection;
        this.isProviderConnected = true;
        this.id = params.id;
    }

    static build(params: TappletSignerParams): TappletSignerL2 {
        const client = WalletDaemonClient.new(new IPCRpcTransport());
        return new TappletSignerL2(params, client);
    }

    public isConnected(): boolean {
        return this.isProviderConnected; //TODO tmp solution shoule be better one
    }

    public async getClient(): Promise<WalletDaemonClient> {
        return this.client;
    }

    // TODO account name should be included in TU Provider method definition to pass the arg
    public async createFreeTestCoins(accountName = 'test', amount = 1_000_000, fee?: number): Promise<AccountData> {
        const res = await this.client.createFreeTestCoins({
            account: (accountName && { Name: accountName }) || null,
            amount,
            max_fee: fee ?? null,
            key_id: null,
        });
        return {
            account_id: res.account.key_index,
            address: (res.account.address as { Component: string }).Component,
            public_key: res.public_key,
            vaults: [],
        };
    }

    public async createAccount(
        accountName?: string,
        fee?: number,
        customAccessRules?: ComponentAccessRules,
        isDefault = true
    ): Promise<AccountData> {
        const res = await this.client.accountsCreate({
            account_name: accountName ?? null,
            custom_access_rules: customAccessRules ?? null,
            is_default: isDefault,
            key_id: null,
            max_fee: fee ?? null,
        });
        return {
            account_id: 0,
            address: (res.address as { Component: string }).Component,
            public_key: res.public_key,
            vaults: [],
        };
    }

    public async getAccount(): Promise<OotleAccount> {
        console.info('🔌 [TU][Provider] getAccountdefault');
        const { account, public_key } = await this.client.accountsGetDefault({});
        console.info('🔌 [TU][Provider] getAccount with accountsGetDefault', account, public_key);

        //TODO JUST TMP CHECKER
        const nftList = await this.client.nftsList({
            account: { ComponentAddress: substateIdToString(account.address) },
            limit: 20,
            offset: 0,
        });
        console.info('🛜 [TU][signer] nfts_list acc', nftList);

        // TODO tip: if fails try `account: { ComponentAddress: account.address }`
        const { balances } = await this.client.accountsGetBalances({
            account: { ComponentAddress: substateIdToString(account.address) },
            refresh: false,
        });

        return {
            account_id: account.key_index,
            address: substateIdToString(account.address),
            account_name: account.name ?? '',
            public_key,

            vaults: balances.map((b: any) => ({
                type: b.resource_type,
                resource_address: b.resource_address,
                balance: b.balance + b.confidential_balance,
                token_symbol: b.token_symbol,
                vault_id:
                    typeof b.vault_address === 'string' && b.vault_address.length > 0
                        ? b.vault_address
                        : 'Vault' in b.vault_address
                          ? b.vault_address.Vault
                          : b.vault_address,
            })),
        };
    }

    public async getAccountBalances(componentAddress: string): Promise<AccountsGetBalancesResponse> {
        return await this.client.accountsGetBalances({
            account: { ComponentAddress: componentAddress },
            refresh: true,
        });
    }

    public async getAccountsList(limit = 10, offset = 0): Promise<AccountsListResponse> {
        return await this.client.accountsList({
            limit,
            offset,
        });
    }

    public async getAccountsBalances(accountName: string, refresh = false): Promise<AccountsGetBalancesResponse> {
        return await this.client.accountsGetBalances({ account: { Name: accountName }, refresh });
    }

    public async getSubstate(substate_id: string): Promise<Substate> {
        // TODO update param type if fix for `substate_id` is done in WalletDaemonClient
        // const substateId = stringToSubstateId(substate_id);
        const { substate, record } = await this.client.substatesGet({ substate_id: substate_id });
        return {
            value: substate,
            address: {
                substate_id: substateIdToString(record?.substate_id),
                version: record?.version ?? 0,
            },
        };
    }

    public async submitTransaction(req: SubmitTransactionRequest): Promise<SubmitTransactionResponse> {
        const params: TransactionSubmitRequest = {
            transaction: {
                V1: {
                    network: req.transaction.network,
                    fee_instructions: req.transaction.fee_instructions as Instruction[],
                    instructions: req.transaction.instructions as Instruction[],
                    inputs: req.transaction.inputs.map((s) => ({
                        substate_id: s.substate_id,
                        version: s.version,
                    })),
                    min_epoch: null,
                    max_epoch: null,
                    is_seal_signer_authorized: req.transaction.is_seal_signer_authorized,
                    dry_run: req.transaction.dry_run,
                },
            },
            signing_key_index: req.account_id,
            detect_inputs: true,
            proof_ids: [],
            detect_inputs_use_unversioned: req.detect_inputs_use_unversioned,
        };

        const res = await this.client.submitTransaction(params);
        return { transaction_id: res.transaction_id };
    }

    public async getTransactionResult(transactionId: string): Promise<GetTransactionResultResponse> {
        const res = await this.client.getTransactionResult({
            transaction_id: transactionId,
        });

        return {
            transaction_id: transactionId,
            status: convertStringToTransactionStatus(res.status),
            result: res.result as any,
        };
    }

    public async getPublicKey(branch: string, index: number): Promise<string> {
        const res = await this.client.createKey({ branch: branch as KeyBranch, specific_index: index });
        return res.public_key;
    }

    public async getTemplateDefinition(template_address: string): Promise<TemplateDefinition> {
        const res = await this.client.templatesGet({ template_address });
        return res.template_definition;
    }

    public async getConfidentialVaultBalances({
        vault_id,
        maximum_expected_value,
        minimum_expected_value,
        view_key_id,
    }: ConfidentialViewVaultBalanceRequest): Promise<VaultBalances> {
        const res = await this.client.viewVaultBalance({
            view_key_id,
            vault_id,
            minimum_expected_value,
            maximum_expected_value,
        });
        return { balances: res.balances as unknown as Map<string, number | null> };
    }

    public async listSubstates({
        filter_by_template,
        filter_by_type,
        limit,
        offset,
    }: ListSubstatesRequest): Promise<ListSubstatesResponse> {
        const res = await this.client.substatesList({
            filter_by_template,
            filter_by_type,
            limit,
            offset,
        } as SubstatesListRequest);
        const substates = res.substates.map((s) => ({
            substate_id: substateIdToString(s.substate_id),
            module_name: s.module_name,
            version: s.version,
            template_address: s.template_address,
        }));

        return { substates };
    }

    public async setDefaultAccount(accountName: string): Promise<AccountSetDefaultResponse> {
        return await this.client.accountsSetDefault({ account: { Name: accountName } });
    }

    public async transactionsPublishTemplate(request: PublishTemplateRequest): Promise<PublishTemplateResponse> {
        return await this.client.publishTemplate(request);
    }

    public async getNftsList({ account, limit, offset }: ListAccountNftRequest): Promise<ListAccountNftResponse> {
        const res = await this.client.nftsList({
            account,
            limit,
            offset,
        });

        return res;
    }

    public async getNftsFromAccountBalances(req: ListAccountNftFromBalancesRequest): Promise<SubstatesGetResponse[]> {
        const accountNfts: SubstatesGetResponse[] = [];
        const balances = req.balances;
        if (balances.length === 0) return accountNfts;

        for (const balance of balances) {
            if (balance.resource_type !== 'NonFungible') continue;

            const substateNft = await this.client.substatesGet({
                substate_id: substateIdToString(balance.vault_address),
            });

            if (substateNft.substate && 'Vault' in substateNft.substate.substate) {
                const resourceContainer = substateNft.substate.substate.Vault.resource_container;
                if (resourceContainer && 'NonFungible' in resourceContainer) {
                    const nonFungibleContainer = resourceContainer.NonFungible;
                    const { address, token_ids } = nonFungibleContainer;

                    for (const tokenId of token_ids) {
                        const nftId = createNftAddressFromResource(address, tokenId);
                        // TODO tmp type convertion untill fix for `substateGet` is done
                        const nftIdSubstate = stringToSubstateId(nftId);
                        const nftData = await this.client.substatesGet({
                            substate_id: substateIdToString(nftIdSubstate),
                        });
                        accountNfts.push(nftData);
                    }
                }
            }
        }
        console.info('🛜🛜🛜 [TU][signer][getNftsFromAccountBalances]', accountNfts);
        return accountNfts;
    }
    public async getWalletInfo(): Promise<WalletGetInfoResponse> {
        return await this.client.walletGetInfo();
    }
    public async accountsList(req: AccountsListRequest): Promise<AccountsListResponse> {
        return await this.client.accountsList(req);
    }
    public async getAccountByAddress(address: string): Promise<AccountGetResponse> {
        const resp = await this.client.accountsGet({
            name_or_address: {
                ComponentAddress: address,
            },
        });
        return resp;
    }
}

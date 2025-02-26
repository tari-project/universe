import { create } from './create.ts';
import { ActiveTapplet } from '@app/types/ootle/tapplet.ts';
import { useAppStateStore } from './appStateStore.ts';
import { TappletProvider, TappletProviderParams } from '@app/types/ootle/TappletProvider.ts';
import { toPermission } from '@app/types/ootle/tariPermissions.ts';
import { TransactionEvent, TUTransaction, txCheck } from '@app/types/ootle/transaction.ts';
import { TariPermissions } from '@tari-project/tari-permissions';
import { FinalizeResult, SubmitTransactionRequest, TransactionStatus, UpSubstates } from '@tari-project/tarijs';
import { useOotleWalletStore } from './useOotleWalletStore.ts';
import { AccountsGetBalancesResponse } from '@tari-project/typescript-bindings';
import { BalanceUpdate, TxSimulation, TxSimulationResult } from '@app/types/ootle/txSimulation.ts';

interface State {
    isInitialized: boolean;
    tappletProvider?: TappletProvider;
    transactions: Record<string, TUTransaction>;
}

//TODO do we need tapp provider id at all?
interface Actions {
    initTappletProvider: () => Promise<void>;
    setTappletProvider: (id: string, launchedTapplet: ActiveTapplet) => Promise<void>;
    addTransaction: (event: MessageEvent<TransactionEvent>) => Promise<void>;
    getTransactionById: (id: number) => TUTransaction | undefined;
    getPendingTransaction: () => TUTransaction | undefined;
    runTransaction: (event: MessageEvent<TransactionEvent>) => Promise<void>;
}

type TappletProviderStoreState = State & Actions;

const initialState: State = {
    isInitialized: false,
    tappletProvider: undefined,
    transactions: {},
};

export const useTappletProviderStore = create<TappletProviderStoreState>()((set, get) => ({
    ...initialState,
    initTappletProvider: async () => {
        try {
            console.info(`🌎️ [TU store][init provider]`);

            const params: TappletProviderParams = {
                id: '0',
                permissions: { requiredPermissions: [], optionalPermissions: [] },
            };
            const provider: TappletProvider = TappletProvider.build(params);

            set({ isInitialized: true, tappletProvider: provider });
        } catch (error) {
            const appStateStore = useAppStateStore.getState();
            console.error('Error setting tapplet provider: ', error);
            appStateStore.setError(`Error setting tapplet provider: ${error}`);
        }
    },
    setTappletProvider: async (id: string, launchedTapplet: ActiveTapplet) => {
        try {
            // TODO tmp solution
            const requiredPermissions = new TariPermissions();
            const optionalPermissions = new TariPermissions();
            if (launchedTapplet.permissions) {
                launchedTapplet.permissions.requiredPermissions.map((p) =>
                    requiredPermissions.addPermission(toPermission(p))
                );
                launchedTapplet.permissions.optionalPermissions.map((p) =>
                    optionalPermissions.addPermission(toPermission(p))
                );
            }
            const params: TappletProviderParams = {
                id,
                permissions: launchedTapplet.permissions ?? { requiredPermissions: [], optionalPermissions: [] },
            };
            const provider: TappletProvider = TappletProvider.build(params);

            set({ isInitialized: true, tappletProvider: provider });
        } catch (error) {
            const appStateStore = useAppStateStore.getState();
            console.error('Error setting tapplet provider: ', error);
            appStateStore.setError(`Error setting tapplet provider: ${error}`);
        }
    },
    addTransaction: async (event: MessageEvent<TransactionEvent>) => {
        const { methodName, args, id } = event.data;
        const provider = get().tappletProvider;
        const appStateStore = useAppStateStore.getState();

        const runSimulation = async (): Promise<TxSimulationResult> => {
            // const { methodName, args, id } = event.data;
            // const provider = get().tappletProvider;
            const account = useOotleWalletStore.getState().ootleAccount;
            const appStateStore = useAppStateStore.getState();
            console.info(`🌎️🌎️🌎️ [TU store][run simulation] SIMULATION`, methodName, id, args);
            console.info(`🌎️🌎️🌎️ [TU store][run simulation] provider & acc`, provider, account);
            try {
                if (!provider || !account) {
                    return createInvalidTransactionResponse('Provider and/or account undefined');
                }
                if (methodName !== 'submitTransaction') {
                    return createInvalidTransactionResponse(`Simulation for ${methodName} not supported`);
                }

                console.info(`🌎️🌎️🌎️ [TU store][run simulation] Run method "${methodName}"`);
                const transactionReq: SubmitTransactionRequest = { ...args[0], is_dry_run: true };
                console.info(`🌎️🌎️🌎️ [TU store][run simulation] tx req`, transactionReq);
                const tx = await provider?.runOne(methodName, [transactionReq]);
                await provider.client.waitForTransactionResult({
                    transaction_id: tx.transaction_id,
                    timeout_secs: 10,
                });
                const txReceipt = await provider.getTransactionResult(tx.transaction_id);
                const txResult = txReceipt.result as FinalizeResult | null;
                console.info(`🌎️🌎️🌎️ [TU store][run simulation] tx result`, txResult);
                if (!txResult?.result) {
                    return createInvalidTransactionResponse('Transaction result undefined');
                }

                const txSimulation: TxSimulation = {
                    status: txReceipt.status,
                    errorMsg: getErrorMessage(txResult),
                };
                if (!txCheck.isAccept(txResult.result)) return { balanceUpdates: [], txSimulation };

                const walletBalances = await fetchWalletBalances(provider, account.address);
                const balanceUpdates = calculateBalanceUpdates(txResult.result.Accept.up_substates, walletBalances);

                if (txReceipt.status !== TransactionStatus.Accepted) {
                    set((state) => ({
                        transactions: {
                            ...state.transactions,
                            [id]: {
                                ...state.transactions[id],
                                ...{ status: 'failure' },
                            },
                        },
                    }));
                    console.info(`🌎️🌎️🌎️ [TU store][run simulation] updated status`, get().transactions);
                }

                return { balanceUpdates, txSimulation, estimatedFee: txResult.fee_receipt.total_fees_paid };
            } catch (error) {
                console.error(`Error running method "${methodName}": ${error}`);
                appStateStore.setError(`Error running method "${methodName}": ${error}`);
                return createInvalidTransactionResponse(`Error running method "${methodName}": ${error}`);
            }
        };

        const submit = async (): Promise<FinalizeResult | null> => {
            // const { methodName, args, id } = event.data;
            try {
                console.info(`🌎️🌎️🌎️ [TU store][SUBMIT] ID`, id);
                if (!provider) {
                    appStateStore.setError(`Provider undefined`);
                    return null;
                }
                // const provider = get().tappletProvider;
                console.info(`🌎️ [TU store][run tx] Running method "${methodName}"`);
                const result = await provider?.runOne(methodName, args);
                if (event.source) {
                    event.source.postMessage({ id, result, type: 'provider-call' }, { targetOrigin: event.origin });
                }
                await provider.client.waitForTransactionResult({
                    transaction_id: result.transaction_id,
                    timeout_secs: 10,
                });
                const txReceipt = await provider.getTransactionResult(result.transaction_id);
                const txResult = txReceipt.result as FinalizeResult | null;
                console.info(`🌎️ [TU store][run tx] RESULT AND RECEIPT`, txReceipt, txResult);
                set((state) => ({
                    transactions: {
                        ...state.transactions,
                        [id]: {
                            ...state.transactions[id],
                            ...{ status: txReceipt.status == TransactionStatus.Accepted ? 'success' : 'failure' },
                        },
                    },
                }));
                return txResult;
            } catch (error) {
                console.error(`Error running method "${methodName}": ${error}`);
                appStateStore.setError(`Error running method "${methodName}": ${error}`);
                return null;
            }
        };

        const cancel = async () => {
            if (event.source) {
                event.source.postMessage(
                    { id, result: {}, resultError: 'Transaction was cancelled', type: 'provider-call' },
                    { targetOrigin: event.origin }
                );
            }

            console.info(`🌎️🌎️🌎️ [TU store][CANCEL] ID`, id);
            // TODO fix
            set((state) => ({
                transactions: {
                    ...state.transactions,
                    [id]: {
                        ...state.transactions[id],
                        ...{ status: 'cancelled' },
                    },
                },
            }));
            console.info(`🌎️🌎️🌎️ [TU store][run simulation] updated status`, get().transactions);
        };

        try {
            console.info(`🌎️ [TU store][init tx]`);

            const newTransaction: TUTransaction = {
                methodName,
                args,
                id,
                status: 'pending',
                submit,
                cancel,
                runSimulation,
            };
            console.info(`🌎️🌎️🌎️  [TU store][init tx] TX ADDED ID`, id);
            // update state
            // const transactions = [...get().transactions, newTx];
            set((state) => ({
                transactions: {
                    ...state.transactions,
                    [id]: newTransaction,
                },
            }));
            console.info(`🌎️ [TU store][init tx] success`, newTransaction);
        } catch (error) {
            // const appStateStore = useAppStateStore.getState();
            console.error('Error setting new transaction: ', error);
            appStateStore.setError(`Error setting new transaction: ${error}`);
        }
    },
    runTransaction: async (event: MessageEvent<TransactionEvent>) => {
        const { methodName, args, id } = event.data;
        try {
            const provider = get().tappletProvider;
            console.info(`🌎️ [TU store][run tx] Running method "${methodName}"`);
            const result = await provider?.runOne(methodName, args);
            if (event.source) {
                event.source.postMessage({ id, result, type: 'provider-call' }, { targetOrigin: event.origin });
            }
        } catch (error) {
            const appStateStore = useAppStateStore.getState();
            console.error(`Error running method "${methodName}": ${error}`);
            appStateStore.setError(`Error running method "${methodName}": ${error}`);
        }
    },

    getTransactionById: (id) => {
        return get().transactions[id];
    },
    getPendingTransaction: () => {
        console.log('TX STORE', get().transactions);
        const pendingTransaction = Object.values(get().transactions).find(
            (transaction) => transaction.status === 'pending'
        );
        console.log('TX pending', pendingTransaction);
        return pendingTransaction;
    },
    // runSimulation: async (id) => {
    //     const tx = get().transactions.find((transaction) => transaction.id === id);
    //     console.log('TX SIMULATION RUN ID', tx);
    //     if (!tx)
    //         return {
    //             balanceUpdates: [],
    //             txSimulation: {
    //                 status: TransactionStatus.InvalidTransaction,
    //                 errorMsg: 'No tx found',
    //             },
    //         };
    //     const { balanceUpdates, estimatedFee, txSimulation } = await tx.runSimulation();
    //     console.log('TX SIMULATION', balanceUpdates, estimatedFee, txSimulation);
    //     return { balanceUpdates, txSimulation, estimatedFee };
    // },
}));

const createInvalidTransactionResponse = (errorMsg: string) => ({
    balanceUpdates: [],
    txSimulation: {
        status: TransactionStatus.InvalidTransaction,
        errorMsg,
    },
});

const fetchWalletBalances = async (
    provider: TappletProvider,
    address: string
): Promise<AccountsGetBalancesResponse> => {
    try {
        return await provider.getAccountBalances(address);
    } catch (error) {
        console.error(error);
        throw new Error(`Error fetching account balances: ${error}`);
    }
};

const calculateBalanceUpdates = (
    up_substates: UpSubstates,
    walletBalances: AccountsGetBalancesResponse
): BalanceUpdate[] => {
    return up_substates
        .map((upSubstate) => {
            const [substateId, { substate }] = upSubstate;

            if (!txCheck.isVaultId(substateId) || !txCheck.isVaultSubstate(substate)) return undefined;
            if (!txCheck.isFungible(substate.Vault.resource_container)) return undefined;

            const userBalance = walletBalances.balances.find((balance) => {
                return txCheck.isVaultId(balance.vault_address) && balance.vault_address.Vault === substateId.Vault;
            });

            if (!userBalance) return undefined;

            return {
                vaultAddress: substateId.Vault,
                tokenSymbol: userBalance.token_symbol || '',
                currentBalance: userBalance.balance,
                newBalance: substate.Vault.resource_container.Fungible.amount,
            };
        })
        .filter((vault): vault is BalanceUpdate => vault !== undefined);
};

const getErrorMessage = (txResult: FinalizeResult): string | undefined => {
    if (txCheck.isReject(txResult?.result)) {
        return txResult.result.Reject as string;
    } else if (txCheck.isAcceptFeeRejectRest(txResult?.result)) {
        return txResult.result.AcceptFeeRejectRest[1] as string;
    }
    return undefined;
};

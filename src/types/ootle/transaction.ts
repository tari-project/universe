import {
    SubstateDiff,
    TransactionResult,
    VaultId,
    Vault,
    SubstateId,
    SubstateValue,
    ResourceContainer,
    ResourceAddress,
    Amount,
    RejectReason,
} from '@tari-project/typescript-bindings';
import { TappletProvider } from './TappletProvider';
import { FinalizeResult, SubmitTransactionRequest } from '@tari-project/tarijs';
import { TxSimulationResult } from './txSimulation';

export interface TransactionEvent {
    methodName: Exclude<keyof TappletProvider, 'runOne'>;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    args: any[];
    id: number;
}

function isOfType<T extends object>(obj: T, key: keyof T): boolean {
    return obj !== null && typeof obj === 'object' && key in obj;
}

export const txCheck = {
    isAccept: (result: TransactionResult): result is { Accept: SubstateDiff } => {
        return 'Accept' in result;
    },

    isVaultId: (substateId: SubstateId): substateId is { Vault: VaultId } => {
        return isOfType(substateId, 'Vault' as keyof SubstateId);
    },

    isVaultSubstate: (substate: SubstateValue): substate is { Vault: Vault } => {
        return 'Vault' in substate;
    },

    isFungible: (
        resourceContainer: ResourceContainer
    ): resourceContainer is { Fungible: { address: ResourceAddress; amount: Amount; locked_amount: Amount } } => {
        return 'Fungible' in resourceContainer;
    },

    isReject: (result: TransactionResult): result is { Reject: RejectReason } => {
        return 'Reject' in result;
    },
    isAcceptFeeRejectRest: (
        result: TransactionResult
    ): result is { AcceptFeeRejectRest: [SubstateDiff, RejectReason] } => {
        return 'AcceptFeeRejectRest' in result;
    },
};

export type TappletTxStatus = 'dryRun' | 'pending' | 'success' | 'failure' | 'cancelled';
export type TappletProviderMethod = Exclude<keyof TappletProvider, 'runOne'>;

export interface TUTransaction {
    id: number;
    methodName: TappletProviderMethod;
    args: SubmitTransactionRequest[];
    status: TappletTxStatus;
    submit: () => Promise<FinalizeResult | null>;
    cancel: () => void;
    runSimulation: () => Promise<TxSimulationResult>;
}

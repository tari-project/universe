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

export interface TransactionEvent {
    methodName: Exclude<keyof TappletProvider, 'runOne'>;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    args: any[];
    id: number;
}

export const txCheck = {
    isAccept: (result: TransactionResult): result is { Accept: SubstateDiff } => {
        return 'Accept' in result;
    },

    isVaultId: (substateId: SubstateId): substateId is { Vault: VaultId } => {
        return 'Vault' in substateId;
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
};

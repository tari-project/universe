import { TransactionStatus } from '@tari-project/tarijs';

export type SimulationStatus = 'pending' | 'success' | 'failure';

export interface Simulation {
    transactionId: number;
    status: SimulationStatus;
    balanceUpdates: BalanceUpdate[];
    errorMsg: string;
    transaction: TxSimulation;
}

export interface BalanceUpdate {
    currentBalance: number;
    newBalance: number;
    vaultAddress: string;
    tokenSymbol: string;
}

export interface TxSimulation {
    status: TransactionStatus;
    errorMsg?: string;
}

export interface TxSimulationResult {
    balanceUpdates: BalanceUpdate[];
    txSimulation: TxSimulation;
    estimatedFee?: number;
}

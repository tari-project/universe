import { BaseNodeState, CpuMiningState, GpuMiningState, WalletBalanceState } from './state';

export const fixtures = {
  nodeReady: {
    block_height: 500000,
    block_time: 120,
    is_synced: true,
    num_connections: 8,
    block_reward: 3528000000,
  } as BaseNodeState,

  nodeDisconnected: {
    block_height: 0,
    is_synced: false,
    num_connections: 0,
  } as BaseNodeState,

  cpuMiningActive: {
    is_mining: true,
    hash_rate: 1250.5,
    estimated_earnings: 125000000,
    is_connected: true,
  } as CpuMiningState,

  cpuMiningIdle: {
    is_mining: false,
    hash_rate: 0,
    estimated_earnings: 0,
    is_connected: false,
  } as CpuMiningState,

  gpuMiningActive: {
    is_mining: true,
    hash_rate: 45000,
    estimated_earnings: 500000000,
  } as GpuMiningState,

  walletFunded: {
    available_balance: 1500000000,
    timelocked_balance: 0,
    pending_incoming_balance: 50000000,
    pending_outgoing_balance: 0,
  } as WalletBalanceState,

  walletEmpty: {
    available_balance: 0,
    timelocked_balance: 0,
    pending_incoming_balance: 0,
    pending_outgoing_balance: 0,
  } as WalletBalanceState,
};

import { Page } from '@playwright/test';

export async function waitForTauriReady(page: Page, timeout = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const ready = await page.evaluate(() => {
        return typeof (window as any).__E2E_INVOKE__ === 'function';
      });
      if (ready) return;
    } catch {
      // page not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Tauri invoke not available after ${timeout}ms`);
}

export async function initReadinessMarker(_page: Page) {
  // no-op: readiness is detected in waitForTauriReady via __E2E_INVOKE__
}

export async function invoke(page: Page, cmd: string, args: Record<string, unknown> = {}) {
  return page.evaluate(
    async ([command, payload]) => {
      const fn = (window as any).__E2E_INVOKE__;
      if (typeof fn !== 'function') {
        throw new Error('Tauri invoke not available - call waitForTauriReady first');
      }
      return fn(command, payload);
    },
    [cmd, args] as const
  );
}

export interface CpuMiningState {
  is_mining?: boolean;
  hash_rate?: number;
  estimated_earnings?: number;
  is_connected?: boolean;
}

export interface GpuMiningState {
  is_mining?: boolean;
  hash_rate?: number;
  estimated_earnings?: number;
}

export interface BaseNodeState {
  block_height?: number;
  block_time?: number;
  is_synced?: boolean;
  num_connections?: number;
  block_reward?: number;
}

export interface WalletBalanceState {
  available_balance?: number;
  timelocked_balance?: number;
  pending_incoming_balance?: number;
  pending_outgoing_balance?: number;
}

export const setState = {
  async cpuMining(page: Page, state: CpuMiningState) {
    await invoke(page, 'e2e_emit_cpu_mining_status', {
      state: {
        is_mining: state.is_mining ?? false,
        hash_rate: state.hash_rate ?? 0,
        estimated_earnings: state.estimated_earnings ?? 0,
        is_connected: state.is_connected ?? false,
      },
    });
  },

  async gpuMining(page: Page, state: GpuMiningState) {
    await invoke(page, 'e2e_emit_gpu_mining_status', {
      state: {
        is_mining: state.is_mining ?? false,
        hash_rate: state.hash_rate ?? 0,
        estimated_earnings: state.estimated_earnings ?? 0,
      },
    });
  },

  async baseNode(page: Page, state: BaseNodeState) {
    await invoke(page, 'e2e_emit_base_node_status', {
      state: {
        block_height: state.block_height ?? 0,
        block_time: state.block_time ?? 0,
        is_synced: state.is_synced ?? false,
        num_connections: state.num_connections ?? 0,
        block_reward: state.block_reward ?? 0,
      },
    });
  },

  async walletBalance(page: Page, state: WalletBalanceState) {
    await invoke(page, 'e2e_emit_wallet_balance', {
      state: {
        available_balance: state.available_balance ?? 0,
        timelocked_balance: state.timelocked_balance ?? 0,
        pending_incoming_balance: state.pending_incoming_balance ?? 0,
        pending_outgoing_balance: state.pending_outgoing_balance ?? 0,
      },
    });
  },

  async closeSplashscreen(page: Page) {
    await invoke(page, 'e2e_emit_close_splashscreen', {});
  },

  async connectionStatus(page: Page, status: 'InProgress' | 'Succeed' | 'Failed') {
    await invoke(page, 'e2e_emit_connection_status', { status });
  },
};

import { Page } from '@playwright/test';

async function invoke(page: Page, cmd: string, args: Record<string, unknown> = {}) {
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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function waitForNodeSynced(page: Page, timeout = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const status = (await invoke(page, 'get_base_node_status')) as { is_synced?: boolean };
      if (status?.is_synced === true) return status;
    } catch {
      // node not ready yet
    }
    await sleep(2_000);
  }
  throw new Error(`Base node did not sync within ${timeout}ms`);
}

export async function waitForMiningActive(page: Page, timeout = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const status = (await invoke(page, 'get_base_node_status')) as {
        is_synced?: boolean;
        block_height?: number;
      };
      if (status?.is_synced && status.block_height && status.block_height > 0) return status;
    } catch {
      // not ready yet
    }
    await sleep(2_000);
  }
  throw new Error(`Mining activity not detected within ${timeout}ms`);
}

export async function waitForWalletBalance(page: Page, minBalance: number, timeout = 300_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const text = await page.$eval('[data-testid="wallet-balance"]', (el) =>
        (el as HTMLElement).innerText.replace(/[^0-9.]/g, '')
      );
      const balance = parseFloat(text);
      if (!isNaN(balance) && balance >= minBalance) return balance;
    } catch {
      // element not visible yet
    }
    await sleep(5_000);
  }
  throw new Error(`Wallet balance did not reach ${minBalance} within ${timeout}ms`);
}

export async function waitForBlockHeight(page: Page, minHeight: number, timeout = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const status = (await invoke(page, 'get_base_node_status')) as { block_height?: number };
      if (status?.block_height != null && status.block_height >= minHeight) return status;
    } catch {
      // not ready yet
    }
    await sleep(2_000);
  }
  throw new Error(`Block height did not reach ${minHeight} within ${timeout}ms`);
}

export async function startCpuMining(page: Page) {
  return invoke(page, 'start_cpu_mining');
}

export async function stopCpuMining(page: Page) {
  return invoke(page, 'stop_cpu_mining');
}

export const sel = {
  mining: {
    cpuHashrate: '[data-testid="cpu-hashrate"]',
    gpuHashrate: '[data-testid="gpu-hashrate"]',
    cpuToggle: '[data-testid="cpu-mining-toggle"]',
    gpuToggle: '[data-testid="gpu-mining-toggle"]',
    estimatedEarnings: '[data-testid="estimated-earnings"]',
  },

  wallet: {
    balance: '[data-testid="wallet-balance"]',
    address: '[data-testid="wallet-address"]',
    pendingBalance: '[data-testid="wallet-pending"]',
  },

  node: {
    status: '[data-testid="node-status"]',
    blockHeight: '[data-testid="block-height"]',
    syncStatus: '[data-testid="sync-status"]',
    peerCount: '[data-testid="peer-count"]',
  },

  app: {
    splashscreen: '[data-testid="splashscreen"]',
    mainContent: '[data-testid="main-content"]',
    errorMessage: '[data-testid="error-message"]',
  },
} as const;

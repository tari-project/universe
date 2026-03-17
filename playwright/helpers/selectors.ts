export const sel = {
  settings: {
    open: '[data-testid="settings-open"]',
    tab: (name: string) => `[data-testid="settings-tab-${name}"]`,
    walletTab: '[data-testid="settings-tab-wallet"]',
    tariAddress: '[data-testid="wallet-tari-address"]',
    seedWordsDisplay: '[data-testid="wallet-seed-words"]',
    seedToggle: '[data-testid="wallet-seed-toggle"]',
  },

  mining: {
    startButton: '[data-testid="mining-button-start"]',
    resumeButton: '[data-testid="mining-button-resume"]',
    pauseButton: '[data-testid="mining-button-pause"]',
    stopOption: '[data-testid="mining-stop"]',
    tileCpu: '[data-testid="mining-tile-cpu"]',
    tileGpu: '[data-testid="mining-tile-gpu"]',
  },

  mode: {
    trigger: '[data-testid="mining-mode-trigger"]',
    option: (name: string) => `[data-testid="mining-mode-${name}"]`,
    ludicrousConfirm: '[data-testid="ludicrous-confirm-keep"]',
    customSave: '[data-testid="custom-levels-save"]',
    customModeDetails: '[data-testid="custom-mode-details"]',
    cpuSlider: '[data-testid="custom-cpu-slider"]',
    gpuSlider: '[data-testid="custom-gpu-slider"]',
  },

  wallet: {
    balance: '[data-testid="wallet-balance"]',
  },

  node: {
    blockHeight: '[data-testid="block-height"]',
  },

  sidebar: {
    mineButton: '[data-testid="sidebar-mine-button"]',
  },

  dialogs: {
    releaseNotesDismiss: '[data-testid="release-notes-dismiss"]',
  },
} as const;

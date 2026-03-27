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
    txRowMined: '[data-testid="tx-row-mined"]',
    txListEmpty: '[data-testid="tx-list-empty"]',
  },

  node: {
    blockHeight: '[data-testid="block-height"]',
  },

  sidebar: {
    mineButton: '[data-testid="sidebar-mine-button"]',
  },

  exchange: {
    mineButton: '[data-testid="exchange-mine-button"]',
    option: (slug: string) => `[data-testid="exchange-option-${slug}"]`,
    addressInput: '[data-testid="exchange-address-input"]',
    confirm: '[data-testid="exchange-confirm"]',
    revertConfirm: '[data-testid="exchange-revert-confirm"]',
    optionUniversal: '[data-testid="exchange-option-universal"]',
  },

  copyAddress: '[data-testid="wallet-copy-address"]',

  send: {
    button: '[data-testid="wallet-send-button"]',
    addressInput: '[data-testid="send-input-address"]',
    amountInput: '[data-testid="send-input-amount"]',
    messageInput: '[data-testid="send-input-message"]',
    reviewButton: '[data-testid="send-review-button"]',
    confirmButton: '[data-testid="send-confirm-button"]',
    doneButton: '[data-testid="send-done-button"]',
    status: '[data-testid="send-status"]',
    txDetailsModal: '[data-testid="tx-details-modal"]',
    copyRaw: '[data-testid="tx-details-copy-raw"]',
    rowDetails: '[data-testid="tx-row-details"]',
  },

  dialogs: {
    releaseNotesDismiss: '[data-testid="release-notes-dismiss"]',
  },
} as const;

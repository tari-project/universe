export const sel = {
  settings: {
    open: '[data-testid="settings-open"]',
    tab: (name: string) => `[data-testid="settings-tab-${name}"]`,
    walletTab: '[data-testid="settings-tab-wallet"]',
    tariAddress: '[data-testid="wallet-tari-address"]',
    moneroAddress: '[data-testid="wallet-monero-address"]',
    seedWordsDisplay: '[data-testid="wallet-seed-words"]',
    seedToggle: '[data-testid="wallet-seed-toggle"]',
    setupPin: '[data-testid="wallet-setup-pin"]',
    syncWithPhone: '[data-testid="wallet-sync-phone"]',
    toggleCpuMining: '[data-testid="settings-toggle-cpu-mining"]',
    toggleGpuMining: '[data-testid="settings-toggle-gpu-mining"]',
    toggleMineOnStart: '[data-testid="settings-toggle-mine-on-start"]',
    togglePauseOnBattery: '[data-testid="settings-toggle-pause-on-battery"]',
    toggleExperimental: '[data-testid="settings-toggle-experimental"]',
    poolToggleCpu: '[data-testid="pool-toggle-cpu"]',
    poolToggleGpu: '[data-testid="pool-toggle-gpu"]',
    connectedPeersCount: '[data-testid="connected-peers-count"]',
    releaseNoteItem: '[data-testid="release-note-item"]',
  },

  mining: {
    startButton: '[data-testid="mining-button-start"]',
    resumeButton: '[data-testid="mining-button-resume"]',
    pauseButton: '[data-testid="mining-button-pause"]',
    stopOption: '[data-testid="mining-stop"]',
    pauseFor: (hours: number) => `[data-testid="mining-pause-${hours}h"]`,
    resumeCountdown: '[data-testid="resume-countdown"]',
    tileCpu: '[data-testid="mining-tile-cpu"]',
    tileGpu: '[data-testid="mining-tile-gpu"]',
  },

  scheduler: {
    open: '[data-testid="scheduler-open"]',
    save: '[data-testid="scheduler-save"]',
    cancel: '[data-testid="scheduler-cancel"]',
    delete: '[data-testid="scheduler-delete"]',
    pauseToggle: '[data-testid="scheduler-pause-toggle"]',
    startTime: '[data-testid="scheduler-start-time"]',
    endTime: '[data-testid="scheduler-end-time"]',
  },

  receive: {
    openButton: '[data-testid="wallet-receive-button"]',
    qr: '[data-testid="receive-qr"]',
    address: '[data-testid="receive-address"]',
    emojiToggle: '[data-testid="receive-emoji-toggle"]',
    copyButton: '[data-testid="receive-copy-address"]',
  },

  sync: {
    haveApp: '[data-testid="sync-have-app"]',
    qr: '[data-testid="sync-qr"]',
    identificationCode: '[data-testid="sync-identification-code"]',
  },

  pin: {
    input: '[data-testid="pin-input"]',
    createSubmit: '[data-testid="pin-create-submit"]',
    createSecondary: '[data-testid="pin-create-secondary"]',
    enterSubmit: '[data-testid="pin-enter-submit"]',
    error: '[data-testid="pin-error"]',
  },

  mcp: {
    serverToggle: '[data-testid="mcp-server-toggle"]',
    serverStatus: '[data-testid="mcp-server-status"]',
    tokenValue: '[data-testid="mcp-token-value"]',
    tokenReveal: '[data-testid="mcp-token-reveal"]',
    tokenCopy: '[data-testid="mcp-token-copy"]',
    tokenRefresh: '[data-testid="mcp-token-refresh"]',
    tokenRevoke: '[data-testid="mcp-token-revoke"]',
    portInput: '[data-testid="mcp-port-input"]',
    tierRead: '[data-testid="mcp-tier-read"]',
    tierControl: '[data-testid="mcp-tier-control"]',
    tierTransactions: '[data-testid="mcp-tier-transactions"]',
    txCountdown: '[data-testid="mcp-tx-countdown"]',
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
    balanceVisibilityToggle: '[data-testid="balance-visibility-toggle"]',
    txRowMined: '[data-testid="tx-row-mined"]',
    txListEmpty: '[data-testid="tx-list-empty"]',
    historyFilter: '[data-testid="tx-history-filter"]',
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

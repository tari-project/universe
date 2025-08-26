export const SETTINGS_TYPES = [
    'general',
    'airdrop',
    'wallet',
    'mining',
    // 'p2p',
    'pools',
    'connections',
    'experimental',
    'releaseNotes',
    'ootleWallet',
    'tapplets',
] as const;
type SettingsTuple = typeof SETTINGS_TYPES;
export type SettingsType = SettingsTuple[number];

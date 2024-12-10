export const SETTINGS_TYPES = [
    'general',
    'airdrop',
    'wallet',
    'mining',
    'p2p',
    'connections',
    'experimental',
    'releaseNotes',
] as const;
type SettingsTuple = typeof SETTINGS_TYPES;
export type SettingsType = SettingsTuple[number];

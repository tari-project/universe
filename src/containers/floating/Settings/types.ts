export const SETTINGS_TYPES = [
    'general',
    'airdrop',
    'wallet',
    'mining',
    'pools',
    'connections',
    'experimental',
    'releaseNotes',
] as const;
type SettingsTuple = typeof SETTINGS_TYPES;
export type SettingsType = SettingsTuple[number];

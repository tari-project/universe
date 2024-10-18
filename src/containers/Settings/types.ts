export const SETTINGS_TYPES = ['general', 'mining', 'wallet', 'airdrop', 'experimental', 'very_experimental'] as const;
type SettingsTuple = typeof SETTINGS_TYPES;
export type SettingsType = SettingsTuple[number];

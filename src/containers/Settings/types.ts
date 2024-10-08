export const SETTINGS_TYPES = ['mining', 'general', 'wallet', 'experimental', 'airdrop'] as const;
type SettingsTuple = typeof SETTINGS_TYPES;
export type SettingsType = SettingsTuple[number];

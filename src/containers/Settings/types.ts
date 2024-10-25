export const SETTINGS_TYPES = ['general', 'wallet', 'mining', 'p2p', 'connections', 'experimental', 'airdrop'] as const;
type SettingsTuple = typeof SETTINGS_TYPES;
export type SettingsType = SettingsTuple[number];

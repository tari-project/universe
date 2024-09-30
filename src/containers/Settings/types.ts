export const SETTINGS_TYPES = ['mining', 'general', 'wallet', 'experimental'] as const;
type SettingsTuple = typeof SETTINGS_TYPES;
export type SettingsType = SettingsTuple[number];

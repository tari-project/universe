import { Button } from '@app/components/elements/Button.tsx';

const SETTINGS_TYPES = ['mining', 'general', 'experimental'] as const;
type SettingsTuple = typeof SETTINGS_TYPES;
export type SettingsType = SettingsTuple[number];

export default function SettingsNavigation() {
    return (
        <div>
            {SETTINGS_TYPES.map((type) => (
                <Button key={type}>{type}</Button>
            ))}
        </div>
    );
}

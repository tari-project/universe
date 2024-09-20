import { Container, SectionButton } from './Navigation.styles.ts';
import { useState } from 'react';

const SETTINGS_TYPES = ['mining', 'general', 'experimental'] as const;
type SettingsTuple = typeof SETTINGS_TYPES;
export type SettingsType = SettingsTuple[number];

export default function SettingsNavigation() {
    const [activeSection, setActiveSection] = useState<SettingsType>('mining');

    function handleClick(section: SettingsType) {
        setActiveSection(section);
    }
    return (
        <Container>
            {SETTINGS_TYPES.map((type) => {
                const isActive = activeSection === type;
                return (
                    <SectionButton
                        key={type}
                        variant={isActive ? 'secondary' : 'primary'}
                        onClick={() => handleClick(type)}
                    >
                        {type}
                    </SectionButton>
                );
            })}
        </Container>
    );
}

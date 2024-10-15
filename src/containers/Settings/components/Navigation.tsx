import { ButtonContainer, Container, DarkModeContainer, SectionButton } from './Navigation.styles.ts';

import { SETTINGS_TYPES, SettingsType } from '../types.ts';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { useUIStore } from '@app/store/useUIStore.ts';
import { setAnimationProperties } from '@app/visuals.ts';

interface SettingsNavigationProps {
    activeSection: SettingsType;
    onChangeActiveSection: (section: SettingsType) => void;
}
export default function SettingsNavigation({ activeSection, onChangeActiveSection }: SettingsNavigationProps) {
    const theme = useUIStore((s) => s.theme);
    const setTheme = useUIStore((s) => s.setTheme);
    const isDarkMode = theme === 'dark';
    function handleClick(section: SettingsType) {
        onChangeActiveSection(section);
    }

    function toggleDarkMode() {
        setTheme(isDarkMode ? 'light' : 'dark');
        const lightBg = [
            { property: 'bgColor1', value: '#F6F6F6' },
            { property: 'bgColor2', value: '#EEEEEE' },
        ];

        const darkBg = [
            { property: 'bgColor1', value: '#1B1B1B' },
            { property: 'bgColor2', value: '#2E2E2E' },
        ];

        setAnimationProperties(isDarkMode ? darkBg : lightBg);
    }
    return (
        <Container>
            <ButtonContainer>
                {SETTINGS_TYPES.map((type) => {
                    const isActive = activeSection === type;

                    return (
                        <SectionButton
                            key={type}
                            size="large"
                            color="secondary"
                            variant={isActive ? 'secondary' : 'primary'}
                            onClick={() => handleClick(type)}
                        >
                            {type}
                        </SectionButton>
                    );
                })}
            </ButtonContainer>
            <DarkModeContainer>
                <ToggleSwitch
                    checked={isDarkMode}
                    onChange={() => toggleDarkMode()}
                    label="Dark mode"
                    variant="gradient"
                />
            </DarkModeContainer>
        </Container>
    );
}

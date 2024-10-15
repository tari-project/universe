import { ButtonContainer, Container, DarkModeContainer, SectionButton } from './Navigation.styles.ts';

import { SETTINGS_TYPES, SettingsType } from '../types.ts';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { useUIStore } from '@app/store/useUIStore.ts';

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
                    onChange={() => setTheme(isDarkMode ? 'light' : 'dark')}
                    label="Dark mode"
                    variant="gradient"
                />
            </DarkModeContainer>
        </Container>
    );
}

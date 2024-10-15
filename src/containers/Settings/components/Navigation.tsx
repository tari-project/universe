import { ButtonContainer, Container, DarkModeContainer, SectionButton } from './Navigation.styles.ts';

import { SETTINGS_TYPES, SettingsType } from '../types.ts';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { useUIStore } from '@app/store/useUIStore.ts';

import { useSwitchTheme } from '@app/hooks/useTheming.ts';

interface SettingsNavigationProps {
    activeSection: SettingsType;
    onChangeActiveSection: (section: SettingsType) => void;
}
export default function SettingsNavigation({ activeSection, onChangeActiveSection }: SettingsNavigationProps) {
    const switchTheme = useSwitchTheme();
    const theme = useUIStore((s) => s.theme);
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
                            color={isActive ? 'primary' : 'secondary'}
                            variant={isActive ? 'primary' : 'secondary'}
                            onClick={() => handleClick(type)}
                        >
                            {type}
                        </SectionButton>
                    );
                })}
            </ButtonContainer>
            <DarkModeContainer>
                <ToggleSwitch checked={isDarkMode} onChange={() => switchTheme()} label="Dark mode" />
            </DarkModeContainer>
        </Container>
    );
}

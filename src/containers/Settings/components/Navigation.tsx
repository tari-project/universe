import { ButtonContainer, Container, SectionButton } from './Navigation.styles.ts';

import { SETTINGS_TYPES, SettingsType } from '../types.ts';
import { ThemeSwitch } from '@app/containers/Settings/components/ThemeSwitch.tsx';

interface SettingsNavigationProps {
    activeSection: SettingsType;
    onChangeActiveSection: (section: SettingsType) => void;
}
export default function SettingsNavigation({ activeSection, onChangeActiveSection }: SettingsNavigationProps) {
    function handleClick(section: SettingsType) {
        onChangeActiveSection(section);
    }

    return (
        <Container>
            <ButtonContainer>
                {SETTINGS_TYPES.map((type) => {
                    const isActiveSection = activeSection === type;

                    return (
                        <SectionButton
                            key={type}
                            size="large"
                            onClick={() => handleClick(type)}
                            variant={isActiveSection ? 'secondary' : 'primary'}
                        >
                            {type}
                        </SectionButton>
                    );
                })}
            </ButtonContainer>
            <ThemeSwitch />
        </Container>
    );
}

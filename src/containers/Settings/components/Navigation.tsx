import { Container, SectionButton } from './Navigation.styles.ts';

import { SETTINGS_TYPES, SettingsType } from '@app/containers/Settings/SettingsModal.tsx';

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
        </Container>
    );
}

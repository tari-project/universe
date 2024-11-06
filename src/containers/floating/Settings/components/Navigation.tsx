import { ButtonContainer, Container, SectionButton } from './Navigation.styles.ts';
import { SETTINGS_TYPES, SettingsType } from '../types.ts';
import { useTranslation } from 'react-i18next';
interface SettingsNavigationProps {
    activeSection: SettingsType;
    onChangeActiveSection: (section: SettingsType) => void;
}
export default function SettingsNavigation({ activeSection, onChangeActiveSection }: SettingsNavigationProps) {
    const { t } = useTranslation('settings', { useSuspense: false });

    function handleClick(section: SettingsType) {
        onChangeActiveSection(section);
    }

    return (
        <Container>
            <ButtonContainer>
                {SETTINGS_TYPES.map((type: SettingsType) => {
                    const isActiveSection = activeSection === type;
                    const name = t(`tabs.${type}`);
                    return (
                        <SectionButton
                            key={type}
                            size="small"
                            onClick={() => handleClick(type)}
                            variant={isActiveSection ? 'secondary' : 'primary'}
                            color="transparent"
                        >
                            {name}
                        </SectionButton>
                    );
                })}
            </ButtonContainer>
        </Container>
    );
}

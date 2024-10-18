import { ButtonContainer, Container, SectionButton } from './Navigation.styles.ts';

import { SETTINGS_TYPES, SettingsType } from '../types.ts';
import { ThemeSwitch } from '@app/containers/Settings/components/ThemeSwitch.tsx';
import { useUIStore } from '@app/store/useUIStore.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import { useTranslation } from 'react-i18next';

interface SettingsNavigationProps {
    activeSection: SettingsType;
    onChangeActiveSection: (section: SettingsType) => void;
}
export default function SettingsNavigation({ activeSection, onChangeActiveSection }: SettingsNavigationProps) {
    const { t } = useTranslation('settings', { useSuspense: false });
    const v_e = useUIStore((s) => s.v_e);
    const very_e = useAppConfigStore((s) => s.very_e);
    const showExperimental = useUIStore((s) => s.showExperimental);
    const tabsToShow =
        showExperimental && v_e && very_e ? SETTINGS_TYPES : SETTINGS_TYPES.slice(0, SETTINGS_TYPES.length - 1);
    function handleClick(section: SettingsType) {
        onChangeActiveSection(section);
    }

    return (
        <Container>
            <ButtonContainer>
                {tabsToShow.map((type: SettingsType) => {
                    const isActiveSection = activeSection === type;
                    const name = t(`tabs.${type}`);
                    return (
                        <SectionButton
                            key={type}
                            size="large"
                            onClick={() => handleClick(type)}
                            variant={isActiveSection ? 'secondary' : 'primary'}
                            color="transparent"
                        >
                            {name}
                        </SectionButton>
                    );
                })}
            </ButtonContainer>
            <ThemeSwitch />
        </Container>
    );
}

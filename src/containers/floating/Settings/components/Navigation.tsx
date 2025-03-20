import { useTranslation } from 'react-i18next';
import { HiOutlineExternalLink } from 'react-icons/hi';
import { Typography } from '@app/components/elements/Typography';
import { SETTINGS_TYPES, SettingsType } from '../types.ts';
import { BottomContainer, ButtonContainer, Container, SectionButton, TermsBtn } from './Navigation.styles.ts';

import { open } from '@tauri-apps/plugin-shell';
import VersionChip from '@app/containers/navigation/components/VersionChip/VersionChip.tsx';
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
                            disableColour
                        >
                            {name}
                        </SectionButton>
                    );
                })}
            </ButtonContainer>
            <BottomContainer>
                <VersionChip />
                <TermsBtn onClick={() => open('https://github.com/tari-project/universe/blob/main/LICENSE.md')}>
                    <Typography>{t('terms-and-conditions')}</Typography>
                    <HiOutlineExternalLink />
                </TermsBtn>
            </BottomContainer>
        </Container>
    );
}

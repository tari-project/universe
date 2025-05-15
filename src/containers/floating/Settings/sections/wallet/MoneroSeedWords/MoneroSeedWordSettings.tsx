import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import SeedWords from '@app/components/wallet/seedwords/SeedWords.tsx';
import {
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/floating/Settings/components/SettingsGroup.styles';

export default function MoneroSeedWordSettings() {
    const { t } = useTranslation('settings', { useSuspense: false });

    return (
        <SettingsGroupWrapper $subGroup>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('monero-seed-words')}</Typography>
            </SettingsGroupTitle>

            <SeedWords isMonero />
        </SettingsGroupWrapper>
    );
}

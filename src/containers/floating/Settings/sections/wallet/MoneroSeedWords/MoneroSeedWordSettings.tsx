import { Typography } from '@app/components/elements/Typography.tsx';
import {
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/floating/Settings/components/SettingsGroup.styles';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useTranslation } from 'react-i18next';

import SeedWords from '@app/components/wallet/seedwords/SeedWords.tsx';

export default function MoneroSeedWordSettings() {
    const { t } = useTranslation('settings', { useSuspense: false });

    return (
        <SettingsGroupWrapper $subGroup>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('monero-seed-words')}</Typography>
            </SettingsGroupTitle>
            <Stack direction="row" alignItems="flex-start" style={{ width: '100%' }} gap={10}>
                <SeedWords isMonero />
            </Stack>
        </SettingsGroupWrapper>
    );
}

import SettingsDialog from './Settings/Settings.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Chip } from '@app/components/elements/Chip.tsx';
import { useTranslation } from 'react-i18next';

function Heading() {
    const { t } = useTranslation('common', { useSuspense: false });
    return (
        <Stack direction="row" justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap={10}>
                <Typography variant="h3">{t('tari-universe')}</Typography>
                <Chip>{t('testnet')}</Chip>
            </Stack>
            <Stack>
                <SettingsDialog />
            </Stack>
        </Stack>
    );
}

export default Heading;

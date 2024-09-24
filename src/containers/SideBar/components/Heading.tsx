import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Chip } from '@app/components/elements/Chip.tsx';
import { useTranslation } from 'react-i18next';
import packageInfo from '../../../../package.json';
import OpenSettingsButton from '@app/containers/Settings/components/OpenSettingsButton.tsx';

const appVersion = packageInfo.version;
const versionString = `v${appVersion}`;
function Heading() {
    const { t } = useTranslation('common', { useSuspense: false });
    return (
        <Stack direction="row" justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap={10}>
                <Typography variant="h3">{t('tari-universe')}</Typography>
                <Chip>
                    {t('testnet')} {versionString}
                </Chip>
            </Stack>
            <OpenSettingsButton />
        </Stack>
    );
}

export default Heading;

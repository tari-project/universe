import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import OpenSettingsButton from '@app/containers/floating/Settings/components/OpenSettingsButton';
import { useTranslation } from 'react-i18next';
import packageInfo from '../../../../../package.json';

import VersionChip from './VersionChip/VersionChip';

const appVersion = packageInfo.version;
const versionString = `v${appVersion}`;
function Heading() {
    const { t } = useTranslation('common', { useSuspense: false });
    return (
        <Stack direction="row" justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap={6}>
                <Typography variant="h3">{t('tari-universe')}</Typography>
                <VersionChip version={versionString} />
            </Stack>
            <OpenSettingsButton />
        </Stack>
    );
}

export default Heading;

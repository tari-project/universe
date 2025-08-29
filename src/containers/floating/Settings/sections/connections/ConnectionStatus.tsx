import { Stack } from '@app/components/elements/Stack.tsx';
import { IoCheckmarkCircle, IoCloudOfflineOutline } from 'react-icons/io5';

import { ConnectionIcon } from '../../components/Settings.styles.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { useNodeStore } from '@app/store/useNodeStore.ts';

export default function ConnectionStatus() {
    const { t } = useTranslation('settings');
    const isConnectedToTariNetwork = useNodeStore((s) => s.isNodeConnected);

    return (
        <Stack direction="row" justifyContent="right" alignItems="center">
            <ConnectionIcon $isConnected={isConnectedToTariNetwork}>
                {isConnectedToTariNetwork ? <IoCheckmarkCircle size={20} /> : <IoCloudOfflineOutline size={16} />}
            </ConnectionIcon>
            <Typography variant="p">
                {t(isConnectedToTariNetwork ? 'connected-to-tari' : 'not-connected-to-tari')}
            </Typography>
        </Stack>
    );
}

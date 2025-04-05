import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';

import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { useNodeStore } from '@app/store/useNodeStore.ts';

export default function Node() {
    const { t } = useTranslation('settings');
    const { node_type, node_identity, node_connection_address } = useNodeStore();

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('minotari-node')}</Typography>
                    </SettingsGroupTitle>
                    <SettingsGroupContent>
                        <Stack direction="column" alignItems="flex-start">
                            <Stack direction="row">
                                <Typography>{t('node-type')}</Typography>
                                <Typography>
                                    <b>{node_type || 'N/A'}</b>
                                </Typography>
                            </Stack>
                            <Stack direction="row">
                                <Typography>{t('node-public-key')}</Typography>
                                <Typography>
                                    <b>{node_identity?.public_key || 'N/A'}</b>
                                </Typography>
                            </Stack>
                            <Stack direction="row">
                                <Typography>{t('node-public-address')}</Typography>
                                <Typography>
                                    <b>{node_identity?.public_address.join(', ') || 'N/A'}</b>
                                </Typography>
                            </Stack>
                            <Stack direction="row">
                                <Typography>{t('node-connection-address')}</Typography>
                                <Typography>
                                    <b>{node_connection_address || 'N/A'}</b>
                                </Typography>
                            </Stack>
                        </Stack>
                    </SettingsGroupContent>
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}

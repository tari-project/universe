import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';

import ConnectionStatus from '../connections/ConnectionStatus.tsx';

import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { formatHashrate } from '@app/utils/formatters.ts';
import { useNodeStore } from '@app/store/useNodeStore.ts';

export default function Network() {
    const { t } = useTranslation('settings');
    const baseNodeStatus = useNodeStore((state) => state?.base_node_status);

    const block_reward = baseNodeStatus?.block_reward || 0;
    const block_height = baseNodeStatus?.block_height || 0;
    const block_time = baseNodeStatus?.block_time || 0;
    const is_synced = baseNodeStatus?.is_synced || false;
    const readiness_status = baseNodeStatus?.readiness_status?.['State'] || 0;

    // Format values
    const formattedBlockReward = formatHashrate(block_reward);

    // Format block time as a date
    const blockDate = new Date(block_time * 1000).toLocaleString();

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('network')}</Typography>
                        <ConnectionStatus />
                    </SettingsGroupTitle>
                    <SettingsGroupContent>
                        <Stack direction="column" alignItems="flex-start">
                            <Stack direction="row">
                                <Typography>{t('block-reward')}</Typography>
                                <Typography>
                                    <b>{baseNodeStatus ? `${formattedBlockReward.value}k XTM` : 'N/A'}</b>
                                </Typography>
                            </Stack>
                            <Stack direction="row">
                                <Typography>{t('block-height')}</Typography>
                                <Typography>
                                    <b>{baseNodeStatus ? block_height.toLocaleString() : 'N/A'}</b>
                                </Typography>
                            </Stack>
                            <Stack direction="row">
                                <Typography>{t('last-block-time')}</Typography>
                                <Typography>
                                    <b>{baseNodeStatus ? blockDate : 'N/A'}</b>
                                </Typography>
                            </Stack>

                            <Stack direction="row">
                                <Typography>{t('sync-status')}</Typography>
                                <Typography>
                                    <b>
                                        {baseNodeStatus
                                            ? t('sync', { context: is_synced ? 'complete' : 'incomplete' })
                                            : 'N/A'}
                                    </b>
                                </Typography>
                            </Stack>
                            <Stack direction="row">
                                <Typography>{t('readiness-status')}</Typography>
                                <Typography>
                                    <b>{baseNodeStatus ? readiness_status : 'N/A'}%</b>
                                </Typography>
                            </Stack>
                        </Stack>
                    </SettingsGroupContent>
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}

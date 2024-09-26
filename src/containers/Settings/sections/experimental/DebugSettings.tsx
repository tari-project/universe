import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useMiningStore } from '@app/store/useMiningStore';
import { ConnectionIcon } from '@app/containers/Settings/components/Settings.styles.tsx';
import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';
import { useMemo } from 'react';

export default function DebugSettings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const lastBlockTime = useBlockchainVisualisationStore((state) => state.displayBlockTime);
    const isConnectedToTariNetwork = useMiningStore((s) => s.base_node?.is_connected);
    const connectedPeers = useMiningStore((state) => state.base_node?.connected_peers || []);

    const displayTime = useMemo(() => {
        if (!lastBlockTime) return '-';

        const { daysString, hoursString, minutes, seconds } = lastBlockTime;
        return `${daysString} ${hoursString} : ${minutes} : ${seconds}`;
    }, [lastBlockTime]);

    return (
        <>
            <SettingsGroupWrapper>
                <SettingsGroup>
                    <SettingsGroupContent>
                        <SettingsGroupTitle>
                            <Typography variant="h6">{t('debug-info', { ns: 'settings' })}</Typography>
                        </SettingsGroupTitle>
                        <Typography variant="p">{t('last-block-added-time', { ns: 'settings' })}</Typography>
                    </SettingsGroupContent>

                    <Stack direction="column" justifyContent="flex-end" alignItems="flex-end" style={{ width: '100%' }}>
                        <Stack direction="row" justifyContent="right" alignItems="center">
                            <ConnectionIcon $isConnected={isConnectedToTariNetwork} size={20} />
                            <Typography variant="p">
                                {t(isConnectedToTariNetwork ? 'connected-to-tari' : 'not-connected-to-tari', {
                                    ns: 'settings',
                                })}
                            </Typography>
                        </Stack>
                        <Typography>{displayTime}</Typography>
                    </Stack>
                </SettingsGroup>
            </SettingsGroupWrapper>
            <SettingsGroupWrapper>
                <SettingsGroupTitle>
                    <Typography variant="h6">{t('connected-peers', { ns: 'settings' })}</Typography>
                </SettingsGroupTitle>
                <SettingsGroup>
                    <SettingsGroupContent style={{ fontSize: '11px' }}>
                        {connectedPeers.map((peer, i) => (
                            <Typography key={peer}>
                                {i + 1}. {peer}
                            </Typography>
                        ))}
                    </SettingsGroupContent>
                </SettingsGroup>
            </SettingsGroupWrapper>
        </>
    );
}

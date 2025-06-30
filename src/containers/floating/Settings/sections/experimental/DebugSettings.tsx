import { Typography } from '@app/components/elements/Typography.tsx';
import { Trans, useTranslation } from 'react-i18next';
import { Stack } from '@app/components/elements/Stack.tsx';
import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';
import { useMemo } from 'react';
import { useMiningMetricsStore } from '@app/store';

export default function DebugSettings() {
    const { t } = useTranslation('settings');
    const lastBlockTime = useBlockchainVisualisationStore((state) => state.debugBlockTime);
    const isConnectedToTariNetwork = useMiningMetricsStore((s) => s.isNodeConnected);
    const displayTime = useMemo(() => {
        if (!lastBlockTime) return '-';

        const { daysString, hoursString, minutes, seconds } = lastBlockTime;
        return `${daysString} ${hoursString} : ${minutes} : ${seconds}`;
    }, [lastBlockTime]);

    const displayText =
        displayTime && isConnectedToTariNetwork ? (
            <Trans
                ns="settings"
                i18nKey={'last-block-added-time'}
                values={{ time: displayTime }}
                components={{ strong: <strong /> }}
            />
        ) : (
            t('waiting-for-data')
        );

    return (
        <>
            <SettingsGroupWrapper>
                <SettingsGroup>
                    <SettingsGroupContent>
                        <SettingsGroupTitle>
                            <Typography variant="h6">{t('debug-info')}</Typography>
                        </SettingsGroupTitle>

                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            style={{ width: '100%' }}
                        >
                            <Typography variant="p">{displayText}</Typography>
                        </Stack>
                    </SettingsGroupContent>
                </SettingsGroup>
            </SettingsGroupWrapper>
        </>
    );
}

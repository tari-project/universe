import { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import useBlockTime from '@app/hooks/mining/useBlockTime.ts';
import { useNodeStore } from '@app/store';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';

export default function DebugSettings() {
    const { t } = useTranslation('settings');

    const isConnectedToTariNetwork = useNodeStore((s) => s.isNodeConnected);

    const { currentTimeParts } = useBlockTime();

    const displayTime = useMemo(() => {
        if (!currentTimeParts) return '-';

        const { daysString, hoursString, minutes, seconds } = currentTimeParts;
        return `${daysString} ${hoursString} : ${minutes} : ${seconds}`;
    }, [currentTimeParts]);

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

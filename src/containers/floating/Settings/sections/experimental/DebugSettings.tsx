import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { Stack } from '@app/components/elements/Stack.tsx';
import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';
import { useMemo } from 'react';

export default function DebugSettings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const lastBlockTime = useBlockchainVisualisationStore((state) => state.debugBlockTime);

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

                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            style={{ width: '100%' }}
                        >
                            <Typography variant="p">{t('last-block-added-time', { ns: 'settings' })}</Typography>
                            <Typography>{displayTime}</Typography>
                        </Stack>
                    </SettingsGroupContent>
                </SettingsGroup>
            </SettingsGroupWrapper>
        </>
    );
}

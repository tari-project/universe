import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';

import { SettingsGroupWrapper } from '@app/containers/floating/Settings/components/SettingsGroup.styles';

import { Stack } from '@app/components/elements/Stack.tsx';
import { useAppStateStore } from '@app/store/appStateStore';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { fetchApplicationsVersions } from '@app/store/actions/appStateStoreActions.ts';

import { CardGrid, InfoCard, InfoContent, InfoLabel, TitleCodeBlock } from './styles.ts';

export default function AppVersions() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const appsInfo = useAppStateStore((state) => state.applications_versions);

    const appMarkup = appsInfo ? (
        <Stack>
            <CardGrid>
                {Object.entries(appsInfo).map(([appName, { version, port }]) => {
                    return (
                        <InfoCard key={`${appName}-${version}`}>
                            <TitleCodeBlock>{appName}</TitleCodeBlock>
                            <InfoContent>
                                <InfoLabel>
                                    {t('version')}: <strong>{version || t('unknown')}</strong>
                                </InfoLabel>
                                {port ? (
                                    <InfoLabel>
                                        {t('port')}: <strong>{port}</strong>
                                    </InfoLabel>
                                ) : null}
                            </InfoContent>
                        </InfoCard>
                    );
                })}
            </CardGrid>
        </Stack>
    ) : null;

    return (
        <SettingsGroupWrapper>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">{t('versions', { ns: 'common' })}</Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <TextButton size="small" onClick={() => fetchApplicationsVersions()}>
                        {t('settings:refresh-versions')}
                    </TextButton>
                </Stack>
            </Stack>
            {appMarkup}
        </SettingsGroupWrapper>
    );
}

import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';
import { CardComponent } from '@app/containers/floating/Settings/components/Card.component';
import { CardContainer } from '@app/containers/floating/Settings/components/Settings.styles';
import { SettingsGroupWrapper } from '@app/containers/floating/Settings/components/SettingsGroup.styles';

import { Stack } from '@app/components/elements/Stack.tsx';
import { useAppStateStore } from '@app/store/appStateStore';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { fetchApplicationsVersions } from '@app/store/actions/appStateStoreActions.ts';

export default function AppVersions() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const applicationsVersions = useAppStateStore((state) => state.applications_versions);

    return applicationsVersions ? (
        <SettingsGroupWrapper>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">{t('versions', { ns: 'common' })}</Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <TextButton size="small" onClick={() => fetchApplicationsVersions()}>
                        {t('refresh-versions', { ns: 'settings' })}
                    </TextButton>
                </Stack>
            </Stack>
            <Stack>
                <CardContainer>
                    {Object.entries(applicationsVersions).map(([key, value]) => (
                        <CardComponent
                            key={`${key}-${value}`}
                            heading={key}
                            labels={[
                                {
                                    labelText: t('version', { ns: 'common' }),
                                    labelValue: value || t('unknown', { ns: 'common' }),
                                },
                            ]}
                        />
                    ))}
                </CardContainer>
            </Stack>
        </SettingsGroupWrapper>
    ) : null;
}

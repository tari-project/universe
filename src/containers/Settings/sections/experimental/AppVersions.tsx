import { Typography } from '@app/components/elements/Typography.tsx';
import { Environment, useEnvironment } from '@app/hooks/useEnvironment.ts';
import { Button } from '@app/components/elements/Button.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useAppStateStore } from '@app/store/appStateStore';
import { CardComponent } from '@app/containers/Settings/components/Card.component.tsx';
import { CardContainer } from '@app/containers/Settings/components/Settings.styles.tsx';
import { SettingsGroupWrapper } from '@app/containers/Settings/components/SettingsGroup.styles.ts';

export default function AppVersions() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const currentEnvironment = useEnvironment();
    const applicationsVersions = useAppStateStore(useShallow((state) => state.applications_versions));
    const fetchApplicationsVersions = useAppStateStore((state) => state.fetchApplicationsVersions);
    const updateApplicationsVersions = useAppStateStore((state) => state.updateApplicationsVersions);

    return applicationsVersions ? (
        <SettingsGroupWrapper>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">{t('versions', { ns: 'common' })}</Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    {currentEnvironment === Environment.Development && (
                        <Button variant="text" size="small" onClick={updateApplicationsVersions}>
                            {t('update-versions', { ns: 'settings' })}
                        </Button>
                    )}
                    <Button variant="text" size="small" onClick={fetchApplicationsVersions}>
                        {t('refresh-versions', { ns: 'settings' })}
                    </Button>
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

import { CardContainer } from '@app/containers/SideBar/components/Settings/Settings.styles.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Environment, useEnvironment } from '@app/hooks/useEnvironment.ts';
import { Button } from '@app/components/elements/Button.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { CardComponent } from '@app/containers/SideBar/components/Settings/Card.component.tsx';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { useApplicationsVersions } from '@app/hooks/useVersions.ts';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

export default function AppVersions() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const currentEnvironment = useEnvironment();
    const applicationsVersions = useAppStatusStore(useShallow((state) => state.applications_versions));
    const { refreshApplicationsVersions, getApplicationsVersions } = useApplicationsVersions();
    return applicationsVersions ? (
        <Stack>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">{t('versions', { ns: 'common' })}</Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    {currentEnvironment === Environment.Development && (
                        <Button variant="text" size="small" onClick={refreshApplicationsVersions}>
                            {t('update-versions', { ns: 'settings' })}
                        </Button>
                    )}
                    <Button variant="text" size="small" onClick={getApplicationsVersions}>
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
        </Stack>
    ) : null;
}

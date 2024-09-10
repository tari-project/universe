import { useTranslation } from 'react-i18next';
import { CardContainer, HorisontalBox } from '@app/containers/SideBar/components/Settings/Settings.styles.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { CardComponent } from '@app/containers/SideBar/components/Settings/Card.component.tsx';

import { useHardwareStatus } from '@app/hooks/useHardwareStatus.ts';
import { Stack } from '@app/components/elements/Stack.tsx';

export default function HardwareStatus() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const { cpu, gpu } = useHardwareStatus();
    return (
        <Stack>
            <HorisontalBox>
                <Typography variant="h6">{t('hardware-status', { ns: 'settings' })}</Typography>
            </HorisontalBox>
            <CardContainer>
                <CardComponent
                    heading={cpu?.label || `${t('unknown', { ns: 'common' })} CPU`}
                    labels={[
                        {
                            labelText: t('usage', { ns: 'common' }),
                            labelValue: `${cpu?.usage_percentage || 0}%`,
                        },
                        {
                            labelText: t('temperature', { ns: 'common' }),
                            labelValue: `${cpu?.current_temperature || 0}°C`,
                        },
                        {
                            labelText: t('max-temperature', { ns: 'common' }),
                            labelValue: `${cpu?.max_temperature || 0}°C`,
                        },
                    ]}
                />
                <CardComponent
                    heading={gpu?.label || `${t('unknown', { ns: 'common' })} GPU`}
                    labels={[
                        {
                            labelText: t('usage', { ns: 'common' }),
                            labelValue: `${gpu?.usage_percentage || 0}%`,
                        },
                        {
                            labelText: t('temperature', { ns: 'common' }),
                            labelValue: `${gpu?.current_temperature || 0}°C`,
                        },
                        {
                            labelText: t('max-temperature', { ns: 'common' }),
                            labelValue: `${gpu?.max_temperature || 0}°C`,
                        },
                    ]}
                />
            </CardContainer>
        </Stack>
    );
}

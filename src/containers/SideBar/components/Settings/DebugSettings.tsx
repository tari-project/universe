import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useMiningStore } from '@app/store/useMiningStore';

export default function DebugSettings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const lastBlockTime = useMiningStore((state) => state.displayBlockTime);

    const { daysString, hoursString, minutes, seconds } = lastBlockTime || {};
    const displayTime = `${daysString} ${hoursString} : ${minutes} : ${seconds}`;

    const debugMarkup = (
        <Stack direction="row" justifyContent="space-between">
            <Typography variant="p">{t('last-block-added-time', { ns: 'settings' })}</Typography>
            <Typography>{displayTime}</Typography>
        </Stack>
    );

    return (
        <>
            <Typography variant="h6">{t('debug-info', { ns: 'settings' })}</Typography>
            {debugMarkup}
        </>
    );
}

import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import calculateTimeSince from '@app/utils/calculateTimeSince.ts';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useShallow } from 'zustand/react/shallow';

export default function DebugSettings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });

    const blockTime = useAppStatusStore(useShallow((state) => state.base_node?.block_time));

    const now = new Date();
    const lastBlockTime = calculateTimeSince(blockTime || 0, now.getTime());
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

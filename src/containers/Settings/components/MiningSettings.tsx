import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/tauri';
import { Stack } from '@app/components/elements/Stack.tsx';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { ChangeEvent } from 'react';
import { useAppStatusStore } from '@app/store/useAppStatusStore';

export default function MiningSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });

    const { mine_on_app_start } = useAppStatusStore((s) => ({
        mine_on_app_start: s.mine_on_app_start,
    }));

    const toggleMiningOnAppStart = (event: ChangeEvent<HTMLInputElement>) => {
        invoke('set_mine_on_app_start', { mineOnAppStart: event.target.checked });
    };

    return (
        <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">{t('mine-on-app-start')}</Typography>
            <ToggleSwitch checked={mine_on_app_start} onChange={toggleMiningOnAppStart} />
        </Stack>
    );
}

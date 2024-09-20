import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { Stack } from '@app/components/elements/Stack.tsx';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

export default function MiningSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });

    const { mineOnAppStart, setMineOnAppStart } = useAppConfigStore((s) => ({
        mineOnAppStart: s.mine_on_app_start,
        setMineOnAppStart: s.setMineOnAppStart,
    }));

    return (
        <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">{t('mine-on-app-start')}</Typography>
            <ToggleSwitch checked={mineOnAppStart} onChange={(event) => setMineOnAppStart(event.target.checked)} />
        </Stack>
    );
}

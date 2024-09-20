import { useCallback } from 'react';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { useTranslation } from 'react-i18next';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';

const GpuMiningMarkup = () => {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const setGpuMiningEnabled = useAppConfigStore((s) => s.setGpuMiningEnabled);
    const isGpuMiningEnabled = useAppConfigStore((s) => s.gpu_mining_enabled);
    const isSettingUp = useAppStateStore((s) => s.isSettingUp);

    const isGPUMiningAvailable = useMiningStore((s) => s.gpu.mining.is_available);

    const handleGpuMiningEnabled = useCallback(async () => {
        await setGpuMiningEnabled(!isGpuMiningEnabled);
    }, [isGpuMiningEnabled, setGpuMiningEnabled]);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('gpu-mining-enabled')}</Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('mining-toggle-warning')}</Typography>
                    {!isGPUMiningAvailable && (
                        <Typography variant="p">{t('gpu-unavailable', { ns: 'settings' })}</Typography>
                    )}
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch
                        checked={isGpuMiningEnabled}
                        disabled={isSettingUp}
                        onChange={handleGpuMiningEnabled}
                    />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};

export default GpuMiningMarkup;

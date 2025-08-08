import { useConfigPoolsStore } from '@app/store';
import { useTranslation } from 'react-i18next';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles';
import { Typography } from '@app/components/elements/Typography';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import {
    changeGpuPool,
    changeGpuPoolConfiguration,
    resetGpuPoolConfiguration,
    toggleGpuPool,
} from '@app/store/actions/appConfigStoreActions';
import { useMiningPoolsStore } from '@app/store/useMiningPoolsStore.ts';
import { PoolStats } from '@app/containers/floating/Settings/sections/pools/PoolStats.tsx';
import { getAvailableGpuPools, getSelectedGpuPool } from '@app/store/selectors/appConfigStoreSelectors';
import { useShallow } from 'zustand/react/shallow';
import { useCallback, useMemo } from 'react';
import { Select } from '@app/components/elements/inputs/Select';
import { PoolConfiguration } from './PoolsConfiguration';
import { BasePoolData } from '@app/types/configs';

export const GpuPoolsSettings = () => {
    const { t } = useTranslation('settings');
    const isGpuPoolEnabled = useConfigPoolsStore((state) => state.gpu_pool_enabled);
    const pool_status = useMiningPoolsStore((s) => s.gpuPoolStats);
    const selectedGpuPoolData = useConfigPoolsStore(getSelectedGpuPool);
    const availableGpuPools = useConfigPoolsStore(useShallow(getAvailableGpuPools));

    const handleToggleGpuPool = (enabled: boolean) => {
        void toggleGpuPool(enabled);
    };

    const poolsOptions = useMemo(() => {
        return (availableGpuPools || []).map((pool) => ({
            label: pool.pool_name,
            value: pool.pool_name,
        }));
    }, [availableGpuPools]);

    const handlePoolChange = useCallback(async (value: string) => {
        await changeGpuPool(value);
    }, []);

    const handlePoolConfigurationChange = useCallback(async (updatedConfig: BasePoolData) => {
        await changeGpuPoolConfiguration(updatedConfig);
    }, []);

    const handleResetToDefaultPoolConfiguration = useCallback(async () => {
        if (!selectedGpuPoolData) return;
        await resetGpuPoolConfiguration(selectedGpuPoolData.pool_name);
    }, []);

    return (
        <SettingsGroupWrapper style={{ gap: '16px' }}>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{'GPU pool'}</Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('mining-toggle-warning')}</Typography>
                </SettingsGroupContent>

                <SettingsGroupAction>
                    <ToggleSwitch checked={isGpuPoolEnabled} onChange={(e) => handleToggleGpuPool(e.target.checked)} />
                </SettingsGroupAction>
            </SettingsGroup>

            {selectedGpuPoolData && <PoolStats poolStatus={pool_status} />}
            <SettingsGroupWrapper $subGroup style={{ marginTop: '12px' }}>
                <SettingsGroup>
                    <SettingsGroupTitle>
                        <Typography variant="h5">{t('pool-configuration')}</Typography>
                    </SettingsGroupTitle>
                </SettingsGroup>
                <SettingsGroup style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{'Selected pool'}</Typography>
                    </SettingsGroupTitle>
                    <SettingsGroupContent style={{ gap: 16 }}>
                        <Select
                            options={poolsOptions}
                            onChange={handlePoolChange}
                            selectedValue={selectedGpuPoolData?.pool_name}
                            variant="bordered"
                            forceHeight={36}
                        />
                        <PoolConfiguration
                            poolConfig={selectedGpuPoolData}
                            onSave={handlePoolConfigurationChange}
                            onReset={handleResetToDefaultPoolConfiguration}
                        />
                    </SettingsGroupContent>
                </SettingsGroup>
            </SettingsGroupWrapper>
        </SettingsGroupWrapper>
    );
};

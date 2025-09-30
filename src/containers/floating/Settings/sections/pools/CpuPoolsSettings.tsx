import { useConfigPoolsStore, useMiningMetricsStore } from '@app/store';
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
    changeCpuPool,
    changeCpuPoolConfiguration,
    resetCpuPoolConfiguration,
    toggleCpuPool,
} from '@app/store/actions/appConfigStoreActions';
import { useMiningPoolsStore } from '@app/store/useMiningPoolsStore.ts';
import { PoolStats } from '@app/containers/floating/Settings/sections/pools/PoolStats.tsx';
import { Select } from '@app/components/elements/inputs/Select';
import { useCallback, useMemo } from 'react';
import { getAvailableCpuPools, getSelectedCpuPool } from '@app/store/selectors/appConfigStoreSelectors';
import { useShallow } from 'zustand/react/shallow';
import { PoolConfiguration } from './PoolsConfiguration';
import { BasePoolData, CpuPools } from '@app/types/configs';

export const CpuPoolsSettings = () => {
    const { t } = useTranslation('settings');

    const isCpuPoolEnabled = useConfigPoolsStore((state) => state.cpu_pool_enabled);
    const isMining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);
    const pool_status = useMiningPoolsStore((s) => s.cpuPoolStats);
    const selectedCpuPoolData = useConfigPoolsStore(getSelectedCpuPool);
    const availableCpuPools = useConfigPoolsStore(useShallow(getAvailableCpuPools));

    const handleToggleCpuPool = (enabled: boolean) => {
        void toggleCpuPool(enabled);
    };

    const poolsOptions = useMemo(() => {
        return (availableCpuPools || []).map((pool) => ({
            label: pool.pool_name,
            value: pool.pool_type,
        }));
    }, [availableCpuPools]);

    const handlePoolChange = useCallback(async (value: string) => {
        await changeCpuPool(value as CpuPools);
    }, []);

    const handlePoolConfigurationChange = useCallback(async (updatedConfig: BasePoolData) => {
        await changeCpuPoolConfiguration(updatedConfig);
    }, []);

    const handleResetToDefaultPoolConfiguration = async () => {
        if (!selectedCpuPoolData) return;
        await resetCpuPoolConfiguration(selectedCpuPoolData.pool_name);
    };

    return (
        <SettingsGroupWrapper style={{ gap: '16px' }}>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{'CPU pool'}</Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('mining-toggle-warning')}</Typography>
                </SettingsGroupContent>

                <SettingsGroupAction>
                    <ToggleSwitch checked={isCpuPoolEnabled} onChange={(e) => handleToggleCpuPool(e.target.checked)} />
                </SettingsGroupAction>
            </SettingsGroup>

            {selectedCpuPoolData && <PoolStats poolStatus={pool_status} isMining={isCpuPoolEnabled && isMining} />}
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
                            selectedValue={selectedCpuPoolData?.pool_type}
                            variant="bordered"
                            forceHeight={36}
                        />
                        <PoolConfiguration
                            poolConfig={selectedCpuPoolData}
                            onSave={handlePoolConfigurationChange}
                            onReset={handleResetToDefaultPoolConfiguration}
                        />
                    </SettingsGroupContent>
                </SettingsGroup>
            </SettingsGroupWrapper>
        </SettingsGroupWrapper>
    );
};

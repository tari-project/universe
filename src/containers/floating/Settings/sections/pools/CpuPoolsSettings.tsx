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
import { toggleCpuPool } from '@app/store/actions/appConfigStoreActions';
import { useMiningPoolsStore } from '@app/store/useMiningPoolsStore.ts';
import { PoolStats } from '@app/containers/floating/Settings/sections/pools/PoolStats.tsx';

export const CpuPoolsSettings = () => {
    const { t } = useTranslation('settings');
    const isCpuPoolEnabled = useConfigPoolsStore((state) => state.cpu_pool_enabled);
    const pool_status = useMiningPoolsStore((s) => s.cpuPoolStats);
    const cpuPoolData = useConfigPoolsStore((state) => state.getCpuPool());

    const handleToggleCpuPool = (enabled: boolean) => {
        void toggleCpuPool(enabled);
    };

    return (
        <SettingsGroupWrapper>
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
            {cpuPoolData && isCpuPoolEnabled && <PoolStats poolStatus={pool_status} poolData={cpuPoolData} />}
        </SettingsGroupWrapper>
    );
};

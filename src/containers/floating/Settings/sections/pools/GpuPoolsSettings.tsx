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
import { toggleGpuPool } from '@app/store/actions/appConfigStoreActions';
import { useMiningPoolsStore } from '@app/store/useMiningPoolsStore.ts';
import { PoolStats } from '@app/containers/floating/Settings/sections/pools/PoolStats.tsx';

export const GpuPoolsSettings = () => {
    const { t } = useTranslation('settings');
    const isGpuPoolEnabled = useConfigPoolsStore((state) => state.gpu_pool_enabled);
    const pool_status = useMiningPoolsStore((s) => s.gpuPoolStats);
    const gpuPoolData = useConfigPoolsStore((state) => state.getGpuPool());

    const handleToggleGpuPool = (enabled: boolean) => {
        void toggleGpuPool(enabled);
    };

    return (
        <SettingsGroupWrapper>
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
            {gpuPoolData && isGpuPoolEnabled && <PoolStats poolStatus={pool_status} poolData={gpuPoolData} />}
        </SettingsGroupWrapper>
    );
};

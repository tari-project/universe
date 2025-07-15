import { useConfigPoolsStore } from '@app/store';
import { useTranslation } from 'react-i18next';
import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles';
import { Typography } from '@app/components/elements/Typography';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { getGpuPool, toggleGpuPool } from '@app/store/actions/appConfigStoreActions';

export const GpuPoolsSettings = () => {
    const { t } = useTranslation('settings');
    const isGpuPoolEnabled = useConfigPoolsStore((state) => state.gpu_pool_enabled);
    const gpuPoolData = getGpuPool();

    const handleToggleGpuPool = (enabled: boolean) => {
        toggleGpuPool(enabled);
    };

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h5">{'GPU pool'}</Typography>
                        <ToggleSwitch
                            checked={isGpuPoolEnabled}
                            onChange={(e) => handleToggleGpuPool(e.target.checked)}
                        />
                    </SettingsGroupTitle>
                    <Typography>{t('mining-toggle-warning')}</Typography>
                    {gpuPoolData && isGpuPoolEnabled && (
                        <SettingsGroupContent style={{ marginTop: '4px' }}>
                            <Typography style={{ fontWeight: 'bold' }}>{gpuPoolData.pool_name}</Typography>
                            <Typography>
                                {'Pool url'}: {gpuPoolData.pool_url}
                            </Typography>
                        </SettingsGroupContent>
                    )}
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};

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
import { getCpuPool, toggleCpuPool } from '@app/store/actions/appConfigStoreActions';

export const CpuPoolsSettings = () => {
    const { t } = useTranslation('settings');
    const isCpuPoolEnabled = useConfigPoolsStore((state) => state.cpu_pool_enabled);
    const cpuPoolData = getCpuPool();

    const handleToggleCpuPool = (enabled: boolean) => {
        toggleCpuPool(enabled);
    };

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h5">{'CPU pool'}</Typography>
                        <ToggleSwitch
                            checked={isCpuPoolEnabled}
                            onChange={(e) => handleToggleCpuPool(e.target.checked)}
                        />
                    </SettingsGroupTitle>
                    <Typography>{t('mining-toggle-warning')}</Typography>
                    {cpuPoolData && isCpuPoolEnabled && (
                        <SettingsGroupContent style={{ marginTop: '4px' }}>
                            <Typography style={{ fontWeight: 'bold' }}>{cpuPoolData.pool_name}</Typography>
                            <Typography>
                                {'Pool url'}: {cpuPoolData.pool_url}
                            </Typography>
                        </SettingsGroupContent>
                    )}
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};

import { useCallback } from 'react';

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
} from '../../components/SettingsGroup.styles.ts';
import { setCpuMiningEnabled } from '@app/store';
import { useSetupStore } from '@app/store/useSetupStore.ts';

export default function CpuMiningSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const isCpuMiningEnabled = useAppConfigStore((s) => s.cpu_mining_enabled);
    const isSettingUp = useSetupStore((s) => !s.setupComplete);

    const handleCpuMiningEnabled = useCallback(async () => {
        await setCpuMiningEnabled(!isCpuMiningEnabled);
    }, [isCpuMiningEnabled]);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('cpu-mining-enabled')}</Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('mining-toggle-warning')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch
                        checked={isCpuMiningEnabled}
                        disabled={isSettingUp}
                        onChange={handleCpuMiningEnabled}
                    />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}

import { useCallback } from 'react';

import { Typography } from '@app/components/elements/Typography.tsx';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';

import { useTranslation } from 'react-i18next';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { setCpuMiningEnabled } from '@app/store/actions/appConfigStoreActions.ts';
import { useConfigMiningStore } from '@app/store/useAppConfigStore.ts';
import { useSetupStore } from '@app/store/useSetupStore.ts';

export default function CpuMiningSettings() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const isCpuMiningEnabled = useConfigMiningStore((s) => s.cpu_mining_enabled);
    const isHardwarePhaseFinished = useSetupStore((s) => s.hardwarePhaseFinished);

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
                        disabled={!isHardwarePhaseFinished}
                        onChange={handleCpuMiningEnabled}
                    />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}

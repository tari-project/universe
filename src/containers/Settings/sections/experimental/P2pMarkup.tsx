import React, { useCallback } from 'react';
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

const P2pMarkup = () => {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const isP2poolEnabled = useAppConfigStore((state) => state.p2pool_enabled);
    const setP2poolEnabled = useAppConfigStore((state) => state.setP2poolEnabled);
    const miningAllowed = useAppStateStore((s) => s.setupProgress >= 1);
    const isCPUMining = useMiningStore((s) => s.cpu.mining.is_mining);
    const isGPUMining = useMiningStore((s) => s.gpu.mining.is_mining);
    const miningInitiated = useMiningStore((s) => s.miningInitiated);
    const isMiningInProgress = isCPUMining || isGPUMining;
    const isDisabled = isMiningInProgress || miningInitiated || !miningAllowed;

    const handleP2poolEnabled = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            await setP2poolEnabled(event.target.checked);
        },
        [setP2poolEnabled]
    );

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">
                            {t('pool-mining', { ns: 'settings' })}
                            <b>&nbsp;(APP RESTART REQUIRED)</b>
                        </Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('pool-mining-description', { ns: 'settings' })}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <ToggleSwitch checked={isP2poolEnabled} disabled={isDisabled} onChange={handleP2poolEnabled} />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};

export default P2pMarkup;

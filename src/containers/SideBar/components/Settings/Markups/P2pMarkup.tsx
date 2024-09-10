import React from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { MinerContainer } from '../../../Miner/styles';
import { useTranslation } from 'react-i18next';

const P2pMarkup = () => {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });

    const { isP2poolEnabled } = useAppStatusStore(
        useShallow((s) => ({
            isP2poolEnabled: s.p2pool_enabled,
        }))
    );

    const miningAllowed = useAppStateStore(useShallow((s) => s.setupProgress >= 1));
    const isCPUMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const isGPUMining = useGPUStatusStore(useShallow((s) => s.is_mining));
    const miningInitiated = useMiningStore(useShallow((s) => s.miningInitiated));
    const isMiningInProgress = isCPUMining || isGPUMining;
    const miningLoading = (miningInitiated && !isMiningInProgress) || (!miningInitiated && isMiningInProgress);

    const handleP2poolEnabled = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        invoke('set_p2pool_enabled', { p2poolEnabled: isChecked }).then(() => {
            console.info('P2pool enabled checked', isChecked);
        });
    };

    return (
        <MinerContainer>
            <Stack>
                <Typography variant="h6">{t('pool-mining', { ns: 'settings' })}</Typography>
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="p">{t('pool-mining-description', { ns: 'settings' })}</Typography>
                    <ToggleSwitch
                        checked={isP2poolEnabled}
                        disabled={isMiningInProgress || !miningAllowed || miningLoading}
                        onChange={handleP2poolEnabled}
                    />
                </Stack>
            </Stack>
        </MinerContainer>
    );
};

export default P2pMarkup;

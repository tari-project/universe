import { TileItem } from '../styles';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Select } from '@app/components/elements/inputs/Select.tsx';

import eco from '@app/assets/icons/emoji/eco.png';
import fire from '@app/assets/icons/emoji/fire.png';
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore.ts';
import { useMiningControls } from '@app/hooks/mining/useMiningControls.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useShallow } from 'zustand/react/shallow';

function ModeSelect() {
    const { t } = useTranslation('common', { useSuspense: false });

    const isSettingUp = useAppStateStore(useShallow((s) => s.isSettingUp));
    const mode = useAppStatusStore(useShallow((s) => s.mode));

    const cpuIsMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const gpuIsMining = useGPUStatusStore(useShallow((s) => s.is_mining));

    const isMiningControlsEnabled = useMiningStore(useShallow((s) => s.miningControlsEnabled));
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const setIsChangingMode = useMiningStore((s) => s.setIsChangingMode);

    const isMiningInitiated = useMiningStore(useShallow((s) => s.miningInitiated));
    const isMining = cpuIsMining || gpuIsMining;

    const { handlePause, handleStart, isMiningLoading } = useMiningControls();

    const handleChange = useCallback(
        async (mode: string) => {
            setIsChangingMode(true);
            if (isMining) {
                await handlePause();
            }
            try {
                await invoke('set_mode', { mode });
                if (isMiningInitiated) {
                    await handleStart();
                }
            } catch (e) {
                console.error(e);
                setIsChangingMode(false);
            }
        },
        [isMining, handlePause, handleStart, isMiningInitiated, setIsChangingMode]
    );

    return (
        <TileItem layoutId="miner-mode-select-tile" layout>
            <Typography>{t('mode')}</Typography>
            <Select
                disabled={isMiningLoading || isChangingMode || isSettingUp || !isMiningControlsEnabled}
                loading={isChangingMode}
                onChange={handleChange}
                selectedValue={mode}
                options={[
                    { label: 'ECO', value: 'Eco', iconSrc: eco },
                    { label: 'Ludicrous', value: 'Ludicrous', iconSrc: fire },
                ]}
            />
        </TileItem>
    );
}

export default ModeSelect;

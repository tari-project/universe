import { TileItem } from '../styles';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Select } from '@app/components/elements/inputs/Select.tsx';

import eco from '@app/assets/icons/emoji/eco.png';
import fire from '@app/assets/icons/emoji/fire.png';
import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import useAppStateStore from '@app/store/appStateStore.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore.ts';
import { useMiningControls } from '@app/hooks/mining/useMiningControls.ts';

function ModeSelect() {
    const { t } = useTranslation('common', { useSuspense: false });
    const [isLoading, setIsLoading] = useState(false);
    const isSettingUp = useAppStateStore((s) => s.isSettingUp);
    const cpuIsMining = useCPUStatusStore((s) => s.is_mining);
    const gpuIsMining = useGPUStatusStore((s) => s.is_mining);

    const isMining = cpuIsMining || gpuIsMining;
    const handleMining = useMiningControls();
    const mode = useAppStatusStore((s) => s.mode);
    const prevMode = useRef(mode);
    const wasMining = useRef(false);

    const changeMode = useCallback(
        async (mode: string) => {
            if (isMining) {
                await handleMining('pause');
                wasMining.current = true;
            }
            try {
                await invoke('set_mode', { mode });

                if (wasMining.current) {
                    await handleMining('start');
                }
            } catch (e) {
                console.error(e);
            }
        },
        [handleMining, isMining]
    );

    const handleChange = (value: string) => {
        setIsLoading(true);
        changeMode(value);
    };

    useEffect(() => {
        if (isLoading && prevMode.current !== mode) {
            setIsLoading(false);
            prevMode.current = mode;
        }
    }, [isLoading, mode]);

    return (
        <TileItem>
            <Typography>{t('mode')}</Typography>
            <Select
                disabled={isLoading || isSettingUp}
                loading={isLoading}
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

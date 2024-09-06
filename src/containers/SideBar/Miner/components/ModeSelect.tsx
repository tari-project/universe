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

function ModeSelect() {
    const { t } = useTranslation('common', { useSuspense: false });
    const [isLoading, setIsLoading] = useState(false);
    const isSettingUp = useAppStateStore((s) => s.isSettingUp);
    const mode = useAppStatusStore((s) => s.mode);
    const prevMode = useRef(mode);
    const changeMode = useCallback(async (mode: string) => {
        try {
            await invoke('set_mode', { mode });
        } catch (e) {
            console.error(e);
        }
    }, []);

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

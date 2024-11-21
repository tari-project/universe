import { ModeSelectWrapper, TileItem } from '../styles';
import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Select, SelectOption } from '@app/components/elements/inputs/Select.tsx';

import eco from '@app/assets/icons/emoji/eco.png';
import fire from '@app/assets/icons/emoji/fire.png';
import custom from '@app/assets/icons/emoji/custom.png';
import { useCallback, useMemo } from 'react';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { modeType } from '@app/store/types';
import { CustomPowerLevelsDialogContainer } from './CustomPowerLevels/CustomPowerLevelsDialogContainer';

function ModeSelect() {
    const { t } = useTranslation('common', { useSuspense: false });
    const isSettingUp = useAppStateStore((s) => s.isSettingUp);
    const mode = useAppConfigStore((s) => s.mode);
    const isCPUMining = useMiningStore((s) => s.cpu.mining.is_mining);
    const isGPUMining = useMiningStore((s) => s.gpu.mining.is_mining);
    const setCustomLevelsDialog = useMiningStore((s) => s.setCustomLevelsDialogOpen);
    const isMiningControlsEnabled = useMiningStore((s) => s.miningControlsEnabled);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const changeMiningMode = useMiningStore((s) => s.changeMiningMode);
    const isMiningInitiated = useMiningStore((s) => s.miningInitiated);
    const isMining = isCPUMining || isGPUMining;
    const isMiningLoading = (isMining && !isMiningInitiated) || (isMiningInitiated && !isMining);
    const custom_power_levels_enabled = useAppConfigStore((s) => s.custom_power_levels_enabled);

    const handleChange = useCallback(
        async (newMode: string) => {
            if (newMode === 'Custom') {
                setCustomLevelsDialog(true);
                return;
            }
            await changeMiningMode({ mode: newMode as modeType });
        },
        [changeMiningMode, setCustomLevelsDialog]
    );

    const tabOptions = useMemo(() => {
        const tabs: SelectOption[] = [
            { label: 'ECO', value: 'Eco', iconSrc: eco },
            { label: 'Ludicrous', value: 'Ludicrous', iconSrc: fire },
        ];

        if (custom_power_levels_enabled) {
            tabs.push({
                label: 'Custom',
                value: 'Custom',
                iconSrc: custom,
            });
        }

        return tabs;
    }, [custom_power_levels_enabled]);

    return (
        <TileItem layoutId="miner-mode-select-tile" layout>
            <Typography>{t('mode')}</Typography>
            <ModeSelectWrapper>
                <Select
                    disabled={isSettingUp}
                    loading={isChangingMode || (isMining && (isMiningLoading || !isMiningControlsEnabled))}
                    onChange={handleChange}
                    selectedValue={mode}
                    options={tabOptions}
                    forceHeight={21}
                />
            </ModeSelectWrapper>
            <CustomPowerLevelsDialogContainer />
        </TileItem>
    );
}

export default ModeSelect;

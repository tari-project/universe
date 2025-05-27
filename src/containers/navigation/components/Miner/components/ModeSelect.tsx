import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { modeType } from '@app/store/types';
import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { setDialogToShow } from '@app/store/actions/uiStoreActions.ts';
import { changeMiningMode, setCustomLevelsDialogOpen } from '@app/store/actions/miningStoreActions.ts';
import { Select, SelectOption } from '@app/components/elements/inputs/Select.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

import eco from '@app/assets/icons/emoji/eco.png';
import fire from '@app/assets/icons/emoji/fire.png';
import custom from '@app/assets/icons/emoji/custom.png';

import { TileItem, TileTop } from '../styles';
import { useConfigMiningStore, useConfigUIStore } from '@app/store';
import { useSetupStore } from '@app/store/useSetupStore';

interface ModeSelectProps {
    variant?: 'primary' | 'minimal';
}
const ModeSelect = memo(function ModeSelect({ variant = 'primary' }: ModeSelectProps) {
    const { t } = useTranslation('common', { useSuspense: false });
    const mode = useConfigMiningStore((s) => s.mode);
    const isCPUMining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);
    const isGPUMining = useMiningMetricsStore((s) => s.gpu_mining_status.is_mining);
    const isHardwarePhaseFinished = useSetupStore((s) => s.hardwarePhaseFinished);

    const isMiningControlsEnabled = useMiningStore((s) => s.miningControlsEnabled);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const isMiningInitiated = useMiningStore((s) => s.isCpuMiningInitiated || s.isGpuMiningInitiated);
    const isMining = isCPUMining || isGPUMining;

    const isMiningLoading = isMiningInitiated ? !isMining : isMining;
    const custom_power_levels_enabled = useConfigUIStore((s) => s.custom_power_levels_enabled);

    const handleChange = useCallback(async (newMode: string) => {
        if (newMode === 'Custom') {
            setCustomLevelsDialogOpen(true);
            return;
        }
        if (newMode === 'Ludicrous') {
            setDialogToShow('ludicrousConfirmation');
            return;
        }
        await changeMiningMode({ mode: newMode as modeType });
    }, []);

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

    const isMininimal = variant === 'minimal';

    const selectMarkup = (
        <Select
            disabled={!isHardwarePhaseFinished}
            loading={
                !isHardwarePhaseFinished ||
                isChangingMode ||
                (isMining && (isMiningLoading || !isMiningControlsEnabled))
            }
            onChange={handleChange}
            selectedValue={mode}
            options={tabOptions}
            forceHeight={21}
            variant={isMininimal ? 'minimal' : 'primary'}
        />
    );

    if (isMininimal) {
        return selectMarkup;
    }

    const headerIcon = tabOptions.find((option) => option.value === mode)?.iconSrc;

    return (
        <TileItem>
            <TileTop>
                <Typography>{t('mode')}</Typography>
                {headerIcon ? (
                    <img
                        src={headerIcon}
                        alt="bla"
                        style={{
                            width: 12,
                            display: 'flex',
                            marginRight: 4,
                        }}
                    />
                ) : null}
            </TileTop>
            {selectMarkup}
        </TileItem>
    );
});

export default ModeSelect;

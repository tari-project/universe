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

import { TileItem } from '../styles';
import { useConfigMiningStore, useConfigUIStore } from '@app/store';

interface ModeSelectProps {
    variant?: 'primary' | 'minimal';
}
const ModeSelect = memo(function ModeSelect({ variant = 'primary' }: ModeSelectProps) {
    const { t } = useTranslation('common', { useSuspense: false });
    const mode = useConfigMiningStore((s) => s.mode);
    const isCPUMining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);
    const isGPUMining = useMiningMetricsStore((s) => s.gpu_mining_status.is_mining);

    const isMiningControlsEnabled = useMiningStore((s) => s.miningControlsEnabled);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const isMiningInitiated = useMiningStore((s) => s.miningInitiated);
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
            loading={isChangingMode || (isMining && (isMiningLoading || !isMiningControlsEnabled))}
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

    return (
        <TileItem $unpadded>
            <Typography style={{ padding: `0 15px` }}>{t('mode')}</Typography>
            {selectMarkup}
        </TileItem>
    );
});

export default ModeSelect;

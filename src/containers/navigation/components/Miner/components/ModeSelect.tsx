import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMiningMetricsStore } from '@app/store/useMiningMetricsStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { setDialogToShow } from '@app/store/actions/uiStoreActions.ts';
import { setCustomLevelsDialogOpen } from '@app/store/actions/miningStoreActions.ts';
import { Select } from '@app/components/elements/inputs/Select.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

import eco from '@app/assets/icons/emoji/eco.png';
import fire from '@app/assets/icons/emoji/fire.png';
import custom from '@app/assets/icons/emoji/custom.png';

import { TileItem, TileTop } from '../styles';
import { useConfigMiningStore } from '@app/store';
import { useSetupStore } from '@app/store/useSetupStore';
import { selectMiningMode } from '@app/store/actions/appConfigStoreActions';
import { MiningModeType } from '@app/types/configs';

interface ModeSelectProps {
    variant?: 'primary' | 'minimal';
    isSync?: boolean;
}

const getModeIcon = (modeType: MiningModeType) => {
    switch (modeType) {
        case MiningModeType.Eco:
            return eco;
        case MiningModeType.Ludicrous:
            return fire;
        case MiningModeType.Custom:
            return custom;
        case MiningModeType.User:
            return custom;
        default:
            return custom;
    }
};

const ModeSelect = memo(function ModeSelect({ variant = 'primary', isSync }: ModeSelectProps) {
    const { t } = useTranslation('common', { useSuspense: false });

    const selectedMiningMode = useConfigMiningStore((s) => s.getSelectedMiningMode());
    const miningModes = useConfigMiningStore((s) => s.mining_modes);
    const isCPUMining = useMiningMetricsStore((s) => s.cpu_mining_status.is_mining);
    const isGPUMining = useMiningMetricsStore((s) => s.gpu_mining_status.is_mining);
    const isHardwarePhaseFinished = useSetupStore((s) => s.hardwarePhaseFinished);

    const isMiningControlsEnabled = useMiningStore((s) => s.miningControlsEnabled);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const isMiningInitiated = useMiningStore((s) => s.isCpuMiningInitiated || s.isGpuMiningInitiated);
    const isMining = isCPUMining || isGPUMining;

    const isMiningLoading = isMiningInitiated ? !isMining : isMining;

    const handleChange = useCallback(async (newMode: string) => {
        if (newMode === 'Custom') {
            setCustomLevelsDialogOpen(true);
            return;
        }
        if (newMode === 'Ludicrous') {
            setDialogToShow('ludicrousConfirmation');
            return;
        }
        await selectMiningMode(newMode);
    }, []);

    const miningTabOptions = useMemo(() => {
        return Object.values(miningModes).map((mode) => {
            const modeName = mode.mode_name;
            const modeIcon = getModeIcon(mode.mode_type);
            return {
                label: modeName,
                value: modeName,
                iconSrc: modeIcon,
            };
        });
    }, [miningModes]);

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
            selectedValue={selectedMiningMode?.mode_name || 'Eco'}
            options={miningTabOptions}
            forceHeight={21}
            variant={isMininimal ? 'minimal' : 'primary'}
            isSync={isSync}
        />
    );

    if (isMininimal) {
        return selectMarkup;
    }

    const headerIcon = miningTabOptions.find((option) => option.value === selectedMiningMode?.mode_name)?.iconSrc;

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

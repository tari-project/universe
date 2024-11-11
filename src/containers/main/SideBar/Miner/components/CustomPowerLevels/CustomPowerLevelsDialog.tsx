import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Typography } from '@app/components/elements/Typography';
import { useMiningStore } from '@app/store/useMiningStore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MaxConsumptionLevels } from '@app/types/app-status';
import { invoke } from '@tauri-apps/api/tauri';
import { RangeInputComponent } from './RangeInput';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import {
    CustomLevelsHeader,
    CustomLevelsContent,
    SuccessContainer,
    TopRightContainer,
} from './CustomPowerLevelsDialog.styles.ts';
import { useTranslation } from 'react-i18next';
import { Divider } from '@app/components/elements/Divider.tsx';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { IoClose } from 'react-icons/io5';
import { LinearProgress } from '@app/components/elements/LinearProgress.tsx';

const useGetMaxConsumptionLevels = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [maxLevels, setMaxLevels] = useState<MaxConsumptionLevels>({
        max_cpu_available: 0,
        max_gpu_available: 0,
    });

    useEffect(() => {
        // Get max CPU and GPU values
        const getMaxConsumptionLevels = async () => {
            setIsLoading(true);
            const res = await invoke('get_max_consumption_levels');
            setMaxLevels(res);
            setIsLoading(false);
        };
        if (maxLevels.max_cpu_available === 0 && !isLoading) {
            getMaxConsumptionLevels();
        }
    }, [maxLevels.max_cpu_available, isLoading]);

    return maxLevels;
};

export function CustomPowerLevelsDialog() {
    const { t } = useTranslation('settings', { useSuspense: false });
    const [saved, setSaved] = useState(false);

    const mode = useAppConfigStore((s) => s.mode);
    const configCpuLevels = useAppConfigStore((s) => s.custom_max_cpu_usage);
    const configGpuLevels = useAppConfigStore((s) => s.custom_max_gpu_usage);

    const customLevelsDialogOpen = useMiningStore((s) => s.customLevelsDialogOpen);
    const setCustomLevelsDialogOpen = useMiningStore((s) => s.setCustomLevelsDialogOpen);

    const changeMiningMode = useMiningStore((s) => s.changeMiningMode);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);

    const maxLevels = useGetMaxConsumptionLevels();

    useEffect(() => {
        // Remove save animation
        if (saved) {
            const timeout = setTimeout(() => setSaved(false), 3000);
            return () => clearTimeout(timeout);
        }
    }, [saved]);

    const gpuValue = useMemo(() => {
        if (mode !== 'Custom' && maxLevels.max_gpu_available) {
            return mode === 'Eco' ? 3 : Math.min(maxLevels.max_gpu_available, 800);
        }
        return configGpuLevels || 0;
    }, [mode, maxLevels.max_gpu_available, configGpuLevels]);

    const cpuValue = useMemo(() => {
        if (mode !== 'Custom' && maxLevels.max_cpu_available) {
            return mode === 'Eco' ? Math.round(maxLevels.max_cpu_available * 0.3) : maxLevels.max_cpu_available;
        }
        return configCpuLevels || 0;
    }, [mode, maxLevels.max_cpu_available, configCpuLevels]);

    const handleChangeCpu = useCallback(
        (value: number) => {
            changeMiningMode({
                mode: 'Custom',
                customCpuLevels: value,
                customGpuLevels: gpuValue,
            }).then(() => setSaved(true));
        },
        [changeMiningMode, gpuValue]
    );

    const handleChangeGpu = useCallback(
        (value: number) => {
            changeMiningMode({
                mode: 'Custom',
                customCpuLevels: cpuValue,
                customGpuLevels: value,
            }).then(() => setSaved(true));
        },
        [changeMiningMode, cpuValue]
    );

    if (!maxLevels.max_cpu_available) return <LinearProgress />;

    return (
        <Dialog open={customLevelsDialogOpen} onOpenChange={setCustomLevelsDialogOpen} disableClose={isChangingMode}>
            <DialogContent>
                <CustomLevelsHeader>
                    <Typography>{t('custom-power-levels.title')}</Typography>
                    <TopRightContainer>
                        <SuccessContainer $visible={isChangingMode || saved}>
                            {t('custom-power-levels.saved')}
                        </SuccessContainer>
                        <IconButton onClick={() => setCustomLevelsDialogOpen(false)}>
                            <IoClose size={18} />
                        </IconButton>
                    </TopRightContainer>
                </CustomLevelsHeader>
                <CustomLevelsContent>
                    <RangeInputComponent
                        label={t('custom-power-levels.cpu-power-level')}
                        maxLevel={maxLevels.max_cpu_available}
                        value={cpuValue}
                        desc={'custom-power-levels.choose-cpu-power-level'}
                        warning={t('custom-power-levels.cpu-warning')}
                        onChange={handleChangeCpu}
                        isLoading={isChangingMode}
                    />
                    <Divider />
                    <RangeInputComponent
                        desc={'custom-power-levels.choose-gpu-power-level'}
                        label={t('custom-power-levels.gpu-power-level')}
                        maxLevel={maxLevels.max_gpu_available}
                        value={gpuValue}
                        warning={t('custom-power-levels.gpu-warning')}
                        onChange={handleChangeGpu}
                        isLoading={isChangingMode}
                        step={2}
                    />
                </CustomLevelsContent>
            </DialogContent>
        </Dialog>
    );
}

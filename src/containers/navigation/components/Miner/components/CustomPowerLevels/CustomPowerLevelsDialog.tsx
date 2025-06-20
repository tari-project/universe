import { Typography } from '@app/components/elements/Typography';
import { useMiningStore } from '@app/store/useMiningStore';
import { useCallback, useEffect, useState } from 'react';
import { GpuThreads, MaxConsumptionLevels } from '@app/types/app-status';

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
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { Button } from '@app/components/elements/buttons/Button.tsx';
import { changeMiningMode } from '@app/store/actions/miningStoreActions.ts';
import { useConfigMiningStore } from '@app/store/useAppConfigStore.ts';

import { PowerLeveltem } from '@app/containers/navigation/components/Miner/components/CustomPowerLevels/PowerLeveltem.tsx';

enum FormFields {
    CPU = 'cpu',
    GPUS = 'gpus',
}

interface FormValues {
    [FormFields.CPU]: number;
    [FormFields.GPUS]: GpuThreads[];
}

interface CustomPowerLevelsDialogProps {
    maxAvailableThreads: MaxConsumptionLevels;
    handleClose: () => void;
}
export function CustomPowerLevelsDialog({ maxAvailableThreads, handleClose }: CustomPowerLevelsDialogProps) {
    const { t } = useTranslation('settings', { useSuspense: false });
    const [saved, setSaved] = useState(false);

    const mode = useConfigMiningStore((s) => s.mode);
    const configCpuLevels = useConfigMiningStore((s) => s.custom_max_cpu_usage);
    const configGpuLevels = useConfigMiningStore((s) => s.custom_max_gpu_usage);
    const ecoCpuLevels = useConfigMiningStore((s) => s.eco_mode_max_cpu_usage);
    const ecoGpuLevels = useConfigMiningStore((s) => s.eco_mode_max_gpu_usage);
    const ludicrousCpuLevels = useConfigMiningStore((s) => s.ludicrous_mode_max_cpu_usage);
    const ludicrousGpuLevels = useConfigMiningStore((s) => s.ludicrous_mode_max_gpu_usage);
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const defaults = {
        Eco: {
            cpu: ecoCpuLevels,
            gpu: ecoGpuLevels,
        },
        Ludicrous: {
            cpu: ludicrousCpuLevels,
            gpu: ludicrousGpuLevels,
        },
    };

    const { control, handleSubmit, setValue, formState } = useForm<FormValues>({
        reValidateMode: 'onSubmit',
        defaultValues: {
            cpu: configCpuLevels > 0 ? configCpuLevels : defaults[mode].cpu || 1,
            gpus: configGpuLevels?.length > 0 ? configGpuLevels : defaults[mode].gpu,
        },
    });

    console.debug(configCpuLevels);

    const { fields } = useFieldArray({
        control,
        name: FormFields.GPUS,
        keyName: 'id',
    });

    useEffect(() => {
        // Remove save animation
        if (saved) {
            const timeout = setTimeout(() => {
                setSaved(false);
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [saved]);

    const onSubmit = useCallback(async (data: FormValues) => {
        await changeMiningMode({
            mode: 'Custom',
            customCpuLevels: data[FormFields.CPU],
            customGpuLevels: data[FormFields.GPUS],
        });
        setSaved(true);
    }, []);

    const cpuMarkup = (
        <Controller
            control={control}
            name={FormFields.CPU}
            render={({ field }) => {
                return (
                    <PowerLeveltem
                        value={field.value}
                        maxLevel={maxAvailableThreads.max_cpu_threads}
                        onChange={field.onChange}
                        label={t('custom-power-levels.cpu-power-level')}
                        descriprion={'custom-power-levels.choose-cpu-power-level'}
                        warning={t('custom-power-levels.cpu-warning')}
                        isLoading={isChangingMode}
                        minLevel={1}
                    />
                );
            }}
        />
    );
    const gpuMarkup = fields?.map((gpu, index) => {
        const maxLevel = maxAvailableThreads?.max_gpus_threads?.[index]?.max_gpu_threads || 8192;
        return (
            <Controller
                key={gpu.id}
                control={control}
                name={`${FormFields.GPUS}.${index}.max_gpu_threads`}
                render={({ field }) => {
                    return (
                        <>
                            <Divider />
                            <PowerLeveltem
                                key={gpu.id}
                                label={`${t('custom-power-levels.gpu-power-level', { index: index + 1 })}: ${gpu.gpu_name}`}
                                maxLevel={maxLevel}
                                value={field.value}
                                minLevel={2}
                                step={2}
                                descriprion={'custom-power-levels.choose-gpu-power-level'}
                                warning={t('custom-power-levels.gpu-warning')}
                                onChange={(value: number) => {
                                    setValue(`${FormFields.GPUS}.${index}.max_gpu_threads`, value as never, {
                                        shouldDirty: true,
                                    });
                                }}
                                isLoading={isChangingMode}
                            />
                        </>
                    );
                }}
            />
        );
    });

    return (
        <>
            <CustomLevelsHeader>
                <Typography>{t('custom-power-levels.title')}</Typography>
                <TopRightContainer>
                    <SuccessContainer $visible={isChangingMode || saved}>
                        {t('custom-power-levels.saved')}
                    </SuccessContainer>
                    <IconButton onClick={handleClose}>
                        <IoClose size={18} />
                    </IconButton>
                </TopRightContainer>
            </CustomLevelsHeader>
            <CustomLevelsContent>
                {cpuMarkup}
                {gpuMarkup}
                <Divider />
                <Button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isChangingMode || (mode === 'Custom' && !formState.isDirty)}
                >
                    {t(`custom-power-levels.${formState.isDirty ? 'save-changes' : 'use-custom'}`)}
                </Button>
            </CustomLevelsContent>
        </>
    );
}

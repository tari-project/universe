import { Typography } from '@app/components/elements/Typography';
import { useMiningStore } from '@app/store/useMiningStore';
import { useCallback, useEffect, useState } from 'react';

import {
    CustomLevelsHeader,
    CustomLevelsContent,
    SuccessContainer,
    TopRightContainer,
    CTAWrapper,
    CurrentModeDetails,
} from './CustomPowerLevelsDialog.styles.ts';
import { useTranslation } from 'react-i18next';

import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { IoClose } from 'react-icons/io5';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@app/components/elements/buttons/Button.tsx';

import { PowerLeveltem } from '@app/containers/navigation/components/Miner/components/CustomPowerLevels/PowerLeveltem.tsx';
import { MiningModeType } from '@app/types/configs.ts';
import { selectMiningMode, updateCustomMiningMode } from '@app/store/actions/appConfigStoreActions.ts';
import { useConfigMiningStore } from '@app/store/useAppConfigStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { setupStoreSelectors } from '@app/store/selectors/setupStoreSelectors.ts';
import { type as osType } from '@tauri-apps/plugin-os';

enum FormFields {
    CPU = 'cpu',
    GPU = 'gpu',
}

interface FormValues {
    [FormFields.CPU]: number;
    [FormFields.GPU]: number;
}

interface CustomPowerLevelsDialogProps {
    handleClose: () => void;
}
export function CustomPowerLevelsDialog({ handleClose }: CustomPowerLevelsDialogProps) {
    const { t } = useTranslation('settings', { useSuspense: false });
    const [saved, setSaved] = useState(false);

    const { currentMode, storedCustomLevels } = useConfigMiningStore(
        useShallow((state) => ({
            currentMode: state.getSelectedMiningMode(),
            storedCustomLevels: state.mining_modes[MiningModeType.Custom],
        }))
    );
    const isChangingMode = useMiningStore((s) => s.isChangingMode);
    const gpuMiningModuleInitialized = useSetupStore(setupStoreSelectors.isGpuMiningModuleInitialized);
    const [isMac, setIsMac] = useState(false);

    useEffect(() => {
        const currentOs = osType();
        if (currentOs) {
            setIsMac(currentOs === 'macos');
        }
    }, []);

    const showGpuSettings = gpuMiningModuleInitialized && !isMac;

    const { control, handleSubmit, formState } = useForm<FormValues>({
        reValidateMode: 'onSubmit',
        defaultValues: {
            cpu: storedCustomLevels?.cpu_usage_percentage || 0,
            gpu: storedCustomLevels?.gpu_usage_percentage || 0,
        },
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
        await updateCustomMiningMode(data[FormFields.CPU], data[FormFields.GPU]).then(() => {
            selectMiningMode('Custom');
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
                        description={`${t('custom-power-levels.input-label', { percentage: field.value, type: 'CPU' })}`}
                        value={field.value}
                        maxLevel={100}
                        onChange={field.onChange}
                        label={t('custom-power-levels.cpu-power-level')}
                        warning={t('custom-power-levels.cpu-warning')}
                        isLoading={isChangingMode}
                        minLevel={1}
                    />
                );
            }}
        />
    );

    const gpuMarkup = (
        <Controller
            control={control}
            name={FormFields.GPU}
            render={({ field }) => {
                return (
                    <PowerLeveltem
                        description={`${t('custom-power-levels.input-label', { percentage: field.value, type: field.name.toUpperCase() })}`}
                        label={`${t('custom-power-levels.gpu-power-level')}`}
                        maxLevel={100}
                        value={field.value}
                        minLevel={1}
                        warning={t('custom-power-levels.gpu-warning')}
                        onChange={field.onChange}
                        isLoading={isChangingMode}
                    />
                );
            }}
        />
    );

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
                {!!currentMode && (
                    <CurrentModeDetails>
                        <Typography variant="p">
                            <span>{`${t('custom-power-levels.current-mode')}: `}</span>
                            {showGpuSettings
                                ? `${currentMode?.mode_name} • CPU ${currentMode?.cpu_usage_percentage}% • GPU ${currentMode?.gpu_usage_percentage}%`
                                : `${currentMode?.mode_name} • CPU ${currentMode?.cpu_usage_percentage}%`}
                        </Typography>
                    </CurrentModeDetails>
                )}
                {cpuMarkup}
                {showGpuSettings && gpuMarkup}
                <CTAWrapper>
                    <Button
                        onClick={handleSubmit(onSubmit)}
                        backgroundColor="greyscale"
                        disabled={
                            isChangingMode || (currentMode?.mode_type === MiningModeType.Custom && !formState.isDirty)
                        }
                    >
                        {t(`custom-power-levels.${formState.isDirty ? 'save-changes' : 'use-custom'}`)}
                    </Button>
                </CTAWrapper>
            </CustomLevelsContent>
        </>
    );
}

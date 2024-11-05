import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { useMiningStore } from '@app/store/useMiningStore';
import { useEffect, useState } from 'react';
import { MaxConsumptionLevels } from '@app/types/app-status';
import { invoke } from '@tauri-apps/api/tauri';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import {
    CustomLelvelsHeader,
    CustomLevelsContent,
    InputDescription,
    RangeIntputWrapper,
    RangeInput,
    RangeLabel,
    RangeLimits,
    InputContainer,
    PerformanceMarker,
    RangeValueHolder,
    RangeInputHolder,
    WarningContainer,
    SuccessContainer,
    TopRightContainer,
    SLIDER_WIDTH,
    SLIDER_THUMB_WIDTH,
} from './CustomPowerLevelsDialog.styles.ts';
import { Trans, useTranslation } from 'react-i18next';
import { Divider } from '@app/components/elements/Divider.tsx';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { IoClose } from 'react-icons/io5';

export function CustomPowerLevelsDialog() {
    const { t } = useTranslation('settings', { useSuspense: false });
    const [initialised, setInitialised] = useState(false);
    const [saved, setSaved] = useState(false);

    const mode = useAppConfigStore((s) => s.mode);
    const configCpuLevels = useAppConfigStore((s) => s.custom_max_cpu_usage);
    const configGpuLevels = useAppConfigStore((s) => s.custom_max_gpu_usage);
    const changeMiningMode = useMiningStore((s) => s.changeMiningMode);

    const customLevelsDialogOpen = useMiningStore((s) => s.customLevelsDialogOpen);
    const setCustomLevelsDialogOpen = useMiningStore((s) => s.setCustomLevelsDialogOpen);

    const [customGpuLevel, setCustomGpuLevel] = useState(1);
    const [customCpuLevel, setCustomCpuLevel] = useState(1);

    const [maxLevels, setMaxLevels] = useState<MaxConsumptionLevels>({
        max_cpu_available: 0,
        max_gpu_available: 0,
    });

    useEffect(() => {
        // Set saved values
        if (!customLevelsDialogOpen || initialised) return;

        if (configCpuLevels) {
            setCustomCpuLevel(configCpuLevels);
        }

        if (configGpuLevels) {
            setCustomGpuLevel(configGpuLevels);
        }

        setInitialised(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [configCpuLevels, configGpuLevels, customLevelsDialogOpen]);

    useEffect(() => {
        // Get max CPU and GPU values
        const getMaxConsumptionLevels = async () => {
            const res = await invoke('get_max_consumption_levels');
            setMaxLevels(res);
        };
        if (customLevelsDialogOpen && !maxLevels.max_cpu_available) {
            getMaxConsumptionLevels();
        }
    }, [customLevelsDialogOpen, maxLevels.max_cpu_available]);

    useEffect(() => {
        // Update config with a slight delay
        if (!initialised || !customLevelsDialogOpen) return;

        if (saved) {
            setSaved(false);
        }

        if (customCpuLevel !== configCpuLevels || customGpuLevel !== configGpuLevels) {
            const timeout = setTimeout(() => {
                changeMiningMode({
                    mode: 'Custom',
                    customCpuLevels: customCpuLevel,
                    customGpuLevels: customGpuLevel,
                }).then(() => setSaved(true));
            }, 400);
            return () => clearTimeout(timeout);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customCpuLevel, customGpuLevel]);

    useEffect(() => {
        // Remove save animation
        if (saved) {
            const timeout = setTimeout(() => setSaved(false), 3000);
            return () => clearTimeout(timeout);
        }
    }, [saved]);

    useEffect(() => {
        if (mode !== 'Custom' && maxLevels.max_gpu_available) {
            const gpuValue = mode === 'Eco' ? 3 : Math.min(maxLevels.max_gpu_available, 800);
            const cpuValue =
                mode === 'Eco' ? Math.round(maxLevels.max_cpu_available * 0.3) : maxLevels.max_cpu_available;
            setCustomGpuLevel(gpuValue);
            setCustomCpuLevel(cpuValue);
        }
    }, [mode, maxLevels.max_gpu_available, maxLevels.max_cpu_available]);

    return (
        <Dialog open={customLevelsDialogOpen} onOpenChange={setCustomLevelsDialogOpen}>
            <DialogContent>
                <CustomLelvelsHeader>
                    {t('custom-power-levels.title')}
                    <TopRightContainer>
                        <SuccessContainer $visible={saved}>{t('custom-power-levels.saved')}</SuccessContainer>

                        <IconButton onClick={() => setCustomLevelsDialogOpen(false)}>
                            <IoClose size={18} />
                        </IconButton>
                    </TopRightContainer>
                </CustomLelvelsHeader>
                <CustomLevelsContent>
                    <RangeInputComponent
                        usePercentage
                        label={t('custom-power-levels.cpu-power-level')}
                        maxLevel={maxLevels.max_cpu_available}
                        value={customCpuLevel}
                        desc={
                            <Trans
                                i18nKey="settings:custom-power-levels.choose-cpu-power-level"
                                components={{
                                    span: <span />,
                                }}
                                values={{
                                    current: customCpuLevel,
                                    max: maxLevels.max_cpu_available,
                                }}
                            />
                        }
                        warning={t('custom-power-levels.cpu-warning')}
                        onChange={setCustomCpuLevel}
                    />
                    <Divider />
                    <RangeInputComponent
                        usePercentage
                        desc={
                            <Trans
                                i18nKey="settings:custom-power-levels.choose-gpu-power-level"
                                components={{
                                    span: <span />,
                                }}
                                values={{
                                    current: customGpuLevel,
                                    max: maxLevels.max_gpu_available,
                                }}
                            />
                        }
                        label={t('custom-power-levels.gpu-power-level')}
                        maxLevel={maxLevels.max_gpu_available}
                        value={customGpuLevel}
                        warning={t('custom-power-levels.gpu-warning')}
                        onChange={setCustomGpuLevel}
                    />
                </CustomLevelsContent>
            </DialogContent>
        </Dialog>
    );
}

interface RangeInputProps {
    label: string;
    maxLevel: number;
    value: number;
    desc: string | React.ReactNode;
    min?: number;
    warning?: string;
    usePercentage?: boolean;
    onChange: (value: number) => void;
}
const RangeInputComponent = ({
    label,
    maxLevel,
    value,
    desc,
    onChange,
    warning,
    min = 0,
    usePercentage = false,
}: RangeInputProps) => {
    const [isHover, setIsHover] = useState(false);
    const { t } = useTranslation('settings', { useSuspense: true });

    const [currentValue, setCurrentValue] = useState(0);

    useEffect(() => {
        if (maxLevel && !currentValue) {
            setCurrentValue(usePercentage ? Math.ceil((value * 100) / maxLevel) : value);
        }
    }, [currentValue, maxLevel, usePercentage, value]);

    const maxValue = usePercentage ? 100 : maxLevel;

    const getPosition = (value: number, max: number) => {
        // Position the value bubble in the range input thumb
        return 15 + ((value - min) / (max - min)) * (SLIDER_WIDTH - SLIDER_THUMB_WIDTH);
    };

    // Check if the value is over 75% of the max level
    const hasWarning = maxValue - min !== 0 && (currentValue * 100) / (maxValue - min) > 75;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = Number(e.target.value);
        if (usePercentage) {
            setCurrentValue(inputValue);
        }
    };

    const handleMouseUp = () => {
        const newValue = usePercentage ? Math.ceil((currentValue * maxLevel) / 100) : currentValue;
        if (value !== newValue) {
            onChange(newValue);
        }
    };

    const ecoLeft = 15 + ((15 - min) / (maxValue - min)) * (SLIDER_WIDTH - SLIDER_THUMB_WIDTH);
    const fireLeft = 15 + ((75 - min) / (maxValue - min)) * (SLIDER_WIDTH - SLIDER_THUMB_WIDTH);

    if (!maxValue) return null;
    return (
        <div>
            <InputContainer>
                <RangeLabel> {label}</RangeLabel>
                <RangeIntputWrapper
                    onMouseEnter={() => setIsHover(true)}
                    onMouseLeave={() => setIsHover(false)}
                    onMouseUp={handleMouseUp}
                >
                    <RangeLimits>
                        {min} {usePercentage ? '%' : ''}
                    </RangeLimits>
                    <RangeInputHolder>
                        <PerformanceMarker
                            $left={ecoLeft}
                            style={{ display: currentValue > 12 && currentValue < 18 ? 'none' : 'block' }}
                        />
                        <PerformanceMarker
                            $left={fireLeft}
                            $red
                            style={{ display: currentValue > 72 && currentValue < 78 ? 'none' : 'block' }}
                        />
                        <RangeValueHolder
                            style={{
                                left: getPosition(currentValue, maxValue),
                                display: isHover ? 'block' : 'none',
                            }}
                        >
                            {currentValue}
                        </RangeValueHolder>
                        <RangeInput
                            $rangeValue={currentValue}
                            type="range"
                            value={currentValue}
                            max={maxValue}
                            min={min}
                            onChange={handleChange}
                        />
                    </RangeInputHolder>
                    <RangeLimits>
                        {maxValue} {usePercentage ? '%' : ''}
                    </RangeLimits>
                </RangeIntputWrapper>
                <InputDescription>{desc}</InputDescription>
            </InputContainer>
            <WarningContainer $visible={hasWarning}>
                <strong>{t('custom-power-levels.warning')}</strong>: {warning}
            </WarningContainer>
        </div>
    );
};

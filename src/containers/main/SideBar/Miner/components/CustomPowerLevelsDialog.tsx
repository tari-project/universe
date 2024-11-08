import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { useMiningStore } from '@app/store/useMiningStore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MaxConsumptionLevels } from '@app/types/app-status';
import { invoke } from '@tauri-apps/api/core';
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
                        label={t('custom-power-levels.cpu-power-level')}
                        maxLevel={maxLevels.max_cpu_available}
                        value={cpuValue}
                        desc={t('custom-power-levels.choose-cpu-power-level')}
                        warning={t('custom-power-levels.cpu-warning')}
                        onChange={handleChangeCpu}
                    />
                    <Divider />
                    <RangeInputComponent
                        desc={t('custom-power-levels.choose-gpu-power-level')}
                        label={t('custom-power-levels.gpu-power-level')}
                        maxLevel={maxLevels.max_gpu_available}
                        value={gpuValue}
                        warning={t('custom-power-levels.gpu-warning')}
                        onChange={handleChangeGpu}
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
    desc: string;
    warning?: string;
    onChange: (value: number) => void;
}
const RangeInputComponent = ({ label, maxLevel, value, desc, onChange, warning }: RangeInputProps) => {
    const min = 1;
    const [isHover, setIsHover] = useState(false);
    const { t } = useTranslation('settings', { useSuspense: true });

    const [currentValue, setCurrentValue] = useState(0);
    const [calculatedValue, setCalculatedValue] = useState(0);

    useEffect(() => {
        if (maxLevel && !currentValue) {
            setCurrentValue(Math.ceil((value * 100) / maxLevel));
            setCalculatedValue(value);
        }
    }, [currentValue, maxLevel, value]);

    const maxValue = 100;

    const getPosition = useCallback((value: number, max: number) => {
        // Position the value bubble in the range input thumb
        return 15 + ((value - min) / (max - min)) * (SLIDER_WIDTH - SLIDER_THUMB_WIDTH);
    }, []);

    // Check if the value is over 75% of the max level
    const hasWarning = (currentValue * 100) / maxValue > 75;

    const handleMouseUp = useCallback(() => {
        setIsHover(false);
        onChange(calculatedValue);
    }, [calculatedValue, onChange]);

    const handleMouseDown = () => {
        setIsHover(true);
    };

    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = Number(event.target.value);
            setCurrentValue(newValue);
            const calculatedValue = Math.ceil((newValue * maxLevel) / 100);
            setCalculatedValue(calculatedValue);
        },
        [maxLevel]
    );

    // Positioning with useMemo for `RangeValueHolder`
    const rangeValueHolderStyle = useMemo(
        () => ({
            left: getPosition(currentValue, maxValue),
            display: isHover ? 'block' : 'none',
        }),
        [getPosition, currentValue, maxValue, isHover]
    );

    const ecomarkstyle = useMemo(
        () => ({
            display: currentValue > 12 && currentValue < 18 ? 'none' : 'block',
            left: 15 + ((15 - min) / (maxValue - min)) * (SLIDER_WIDTH - SLIDER_THUMB_WIDTH),
        }),
        [currentValue]
    );

    const firemarkstyle = useMemo(
        () => ({
            display: currentValue > 72 && currentValue < 78 ? 'none' : 'block',
            left: 15 + ((75 - min) / (maxValue - min)) * (SLIDER_WIDTH - SLIDER_THUMB_WIDTH),
        }),
        [currentValue]
    );

    const rangeValueStyle = useMemo(
        () => ({
            background: currentValue
                ? `linear-gradient(to right, #813bf5 ${currentValue || 1}%, #ddd ${currentValue || 1}%)`
                : '#ddd',
        }),
        [currentValue]
    );

    if (!maxValue) return null;
    return (
        <div>
            <InputContainer>
                <RangeLabel> {label}</RangeLabel>
                <RangeIntputWrapper onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
                    <RangeLimits>{'0 %'}</RangeLimits>
                    <RangeInputHolder>
                        <PerformanceMarker style={ecomarkstyle} />
                        <PerformanceMarker $red style={firemarkstyle} />
                        <RangeValueHolder style={rangeValueHolderStyle}>{`${currentValue}%`}</RangeValueHolder>
                        <RangeInput
                            type="range"
                            value={currentValue}
                            style={rangeValueStyle}
                            max={maxValue}
                            min={1}
                            onChange={handleChange}
                        />
                    </RangeInputHolder>
                    <RangeLimits>{`${maxValue} %`}</RangeLimits>
                </RangeIntputWrapper>
                <InputDescription
                    dangerouslySetInnerHTML={{
                        __html: desc
                            .replace('{{current}}', calculatedValue.toString())
                            .replace('{{max}}', maxLevel.toString()),
                    }}
                ></InputDescription>
            </InputContainer>
            <WarningContainer $visible={hasWarning}>
                <strong>{t('custom-power-levels.warning')}</strong>: {warning}
            </WarningContainer>
        </div>
    );
};

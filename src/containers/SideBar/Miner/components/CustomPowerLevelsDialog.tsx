import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { useMiningStore } from '@app/store/useMiningStore';
import { useEffect, useState } from 'react';
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
    IconImage,
    RangeValueHolder,
    RangeInputHolder,
    WarningContainer,
    SuccessContainer,
    TopRightContainer,
} from './CustomPowerLevelsDialog.styles.ts';
import { useTranslation } from 'react-i18next';
import eco from '@app/assets/icons/emoji/eco.png';
import fire from '@app/assets/icons/emoji/fire.png';
import { Divider } from '@app/components/elements/Divider.tsx';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { IoClose } from 'react-icons/io5';

export function CustomPowerLevelsDialog() {
    const { t } = useTranslation('settings', { useSuspense: false });
    const [initialised, setInitialised] = useState(false);
    const [saved, setSaved] = useState(false);

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
            }, 800);
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
                        value={customCpuLevel}
                        desc={t('custom-power-levels.choose-cpu-power-level')}
                        warning={t('custom-power-levels.cpu-warning')}
                        onChange={setCustomCpuLevel}
                    />
                    <Divider />
                    <RangeInputComponent
                        label={t('custom-power-levels.gpu-power-level')}
                        maxLevel={maxLevels.max_gpu_available}
                        value={customGpuLevel}
                        desc={t('custom-power-levels.choose-gpu-power-level')}
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
    desc: string;
    min?: number;
    warning?: string;
    onChange: (value: number) => void;
}
const RangeInputComponent = ({ label, maxLevel, value, desc, onChange, warning, min = 1 }: RangeInputProps) => {
    const { t } = useTranslation('settings', { useSuspense: true });
    const getPosition = (value: number, max: number) => {
        // Position the value bubble in the range input thumb
        return 15 + ((value - min) / (max - min)) * (600 - 30);
    };

    // Check if the value is over 75% of the max level
    const hasWarning = (value * 100) / (maxLevel - min) > 75;

    if (!maxLevel) return null;
    return (
        <div>
            <InputContainer>
                <RangeLabel> {label}</RangeLabel>
                <RangeIntputWrapper>
                    <RangeLimits>{min}</RangeLimits>
                    <RangeInputHolder>
                        <IconImage src={eco} alt="eco" $left={15} />
                        <IconImage src={fire} alt="ludicrous" $left={75} />
                        <RangeValueHolder
                            style={{
                                left: getPosition(value, maxLevel),
                            }}
                        >
                            {value}
                        </RangeValueHolder>
                        <RangeInput
                            type="range"
                            value={value}
                            max={maxLevel}
                            min={min}
                            onChange={(e) => onChange(parseInt(e.target.value))}
                        />
                    </RangeInputHolder>
                    <RangeLimits>{maxLevel}</RangeLimits>
                </RangeIntputWrapper>
                <InputDescription>{desc}</InputDescription>
            </InputContainer>
            <WarningContainer $visible={hasWarning}>
                <strong>{t('custom-power-levels.warning')}</strong>: {warning}
            </WarningContainer>
        </div>
    );
};

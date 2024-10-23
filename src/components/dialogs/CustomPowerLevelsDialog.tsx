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
    IconImage,
    RangeValueHolder,
    RangeInputHolder,
    WarningContainer,
} from './CustomPowerLevelsDialog.styles.ts';
import { useTranslation } from 'react-i18next';
import eco from '@app/assets/icons/emoji/eco.png';
import fire from '@app/assets/icons/emoji/fire.png';
import { Divider } from '../elements/Divider.tsx';

export function CustomPowerLevelsDialog() {
    const { t } = useTranslation('settings', { useSuspense: true });

    const configCpuLevels = useAppConfigStore((s) => s.custom_cpu_usage);
    const configGpuLevels = useAppConfigStore((s) => s.custom_gpu_usage);
    const changeMiningMode = useMiningStore((s) => s.changeMiningMode);

    const customLevelsDialogOpen = useMiningStore((s) => s.customLevelsDialogOpen);
    const setCustomLevelsDialogOpen = useMiningStore((s) => s.setCustomLevelsDialogOpen);

    const [customGpuLevel, setCustomGpuLevel] = useState(0);
    const [customCpuLevel, setCustomCpuLevel] = useState(0);

    const [maxLevels, setMaxLevels] = useState<MaxConsumptionLevels>({
        max_cpu_available: 0,
        max_gpu_available: 0,
    });

    useEffect(() => {
        if (configCpuLevels) {
            setCustomCpuLevel(configCpuLevels);
        }

        if (configGpuLevels) {
            setCustomGpuLevel(configGpuLevels);
        }
    }, [configCpuLevels, configGpuLevels]);

    useEffect(() => {
        const getMaxConsumptionLevels = async () => {
            const res = await invoke('get_max_consumption_levels');
            setMaxLevels(res);
        };
        getMaxConsumptionLevels();
    }, []);

    useEffect(() => {
        if (customCpuLevel !== configCpuLevels || customGpuLevel !== configGpuLevels) {
            const timeout = setTimeout(() => {
                changeMiningMode({ mode: 'Custom', customCpuLevels: customCpuLevel, customGpuLevels: customGpuLevel });
            }, 500);
            return () => clearTimeout(timeout);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customCpuLevel, configCpuLevels]);

    return (
        <Dialog open={customLevelsDialogOpen} onOpenChange={setCustomLevelsDialogOpen}>
            <DialogContent>
                <CustomLelvelsHeader>{t('custom-power-levels.title')}</CustomLelvelsHeader>
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
    warning?: string;
    onChange: (value: number) => void;
}
const RangeInputComponent = ({ label, maxLevel, value, desc, onChange, warning }: RangeInputProps) => {
    const { t } = useTranslation('settings', { useSuspense: true });
    const getPosition = (value: number, max: number) => {
        return 15 + (value / max) * (600 - 30);
    };

    const hasWarning = (value * 100) / maxLevel > 75;
    if (!maxLevel) return null;
    return (
        <div>
            <InputContainer>
                <RangeLabel> {label}</RangeLabel>
                <RangeIntputWrapper>
                    <RangeLimits>0%</RangeLimits>
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
                            min={0}
                            onChange={(e) => onChange(parseInt(e.target.value))}
                        />
                    </RangeInputHolder>
                    <RangeLimits>100%</RangeLimits>
                </RangeIntputWrapper>
                <InputDescription>{desc}</InputDescription>
            </InputContainer>
            <WarningContainer $visible={hasWarning}>
                <strong>{t('custom-power-levels.warning')}</strong>: {warning}
            </WarningContainer>
        </div>
    );
};

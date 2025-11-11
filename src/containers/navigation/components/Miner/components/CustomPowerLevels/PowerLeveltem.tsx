import { useTranslation } from 'react-i18next';
import { SliderInput } from '@app/components/elements/inputs/range/Slider.tsx';
import { InputDescription, RangeLabel, TopContent, WarningContainer } from './RangeInput.styles.ts';
import { PowerLeveltemWrapper } from '@app/components/elements/inputs/range/styles.ts';

interface PowerLeveltemProps {
    label: string;
    maxLevel: number;
    minLevel: number;
    description: string;
    value: number;
    onChange: (value: number) => void;
    warning?: string;
    isLoading?: boolean;
    step?: number;
}

function convertToPercentage(value: number, max: number): number {
    return Math.ceil((value * 100) / max);
}
export const PowerLeveltem = ({
    label,
    maxLevel,
    minLevel,
    value,
    description,
    onChange,
    warning,
    step = 1,
    isLoading = false,
}: PowerLeveltemProps) => {
    const { t } = useTranslation('settings');
    // Check if the value is over 75% of the max level
    const hasWarning = convertToPercentage(value, maxLevel) > 75;

    return (
        <PowerLeveltemWrapper>
            <TopContent>
                <RangeLabel>{label}</RangeLabel>
                <WarningContainer $visible={hasWarning}>
                    <strong>{t('custom-power-levels.warning')}</strong>: {warning}
                </WarningContainer>
            </TopContent>
            <SliderInput
                defaultValue={value}
                maxValue={maxLevel}
                startingValue={minLevel}
                onChange={onChange}
                performanceMarkers
                stepSize={step}
                isStepped={!!step}
                isLoading={isLoading}
            />
            <InputDescription>{description}</InputDescription>
        </PowerLeveltemWrapper>
    );
};

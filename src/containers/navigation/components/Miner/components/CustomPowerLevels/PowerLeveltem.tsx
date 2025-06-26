import { Trans, useTranslation } from 'react-i18next';
import { SliderInput } from '@app/components/elements/inputs/range/Slider.tsx';
import { InputDescription, RangeLabel, WarningContainer } from './RangeInput.styles.ts';
import { PowerLeveltemWrapper } from '@app/components/elements/inputs/range/styles.ts';

interface PowerLeveltemProps {
    label: string;
    maxLevel: number;
    minLevel: number;
    descriprion: string;
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
    descriprion,
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
            <RangeLabel>{label}</RangeLabel>
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
            <InputDescription>
                <Trans
                    i18nKey={descriprion}
                    ns="settings"
                    values={{
                        current: value.toString(),
                        max: maxLevel.toString(),
                    }}
                    components={{ span: <span /> }}
                />
            </InputDescription>
            <WarningContainer $visible={hasWarning}>
                <strong>{t('custom-power-levels.warning')}</strong>: {warning}
            </WarningContainer>
        </PowerLeveltemWrapper>
    );
};

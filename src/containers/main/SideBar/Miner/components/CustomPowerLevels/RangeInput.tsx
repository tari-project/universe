import { useCallback, useEffect, useMemo, useRef, useState, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
    InputContainer,
    InputDescription,
    PerformanceMarker,
    RangeInput,
    RangeInputHolder,
    RangeInputWrapper,
    RangeLabel,
    RangeLimits,
    RangeValueHolder,
    SLIDER_THUMB_WIDTH,
    SLIDER_WIDTH,
    WarningContainer,
} from './RangeInput.styles';

interface RangeInputProps {
    label: string;
    maxLevel: number;
    value: number;
    desc: string;
    warning?: string;
    isLoading?: boolean;
    usePercentage?: boolean;
    step?: number;
    onChange: (value: number) => void;
}

function convertToPercentage(value: number, max: number): number {
    return Math.ceil((value * 100) / max);
}
function convertToUnit(value: number, max: number): number {
    return Math.ceil((value * max) / 100);
}
export const RangeInputComponent = ({
    label,
    maxLevel,
    value,
    desc,
    onChange,
    warning,
    step,
    isLoading = false,
    usePercentage = false,
}: RangeInputProps) => {
    const min = step ?? 1;
    const [isHover, setIsHover] = useState(false);
    const { t } = useTranslation('settings', { useSuspense: true });

    const [currentValue, setCurrentValue] = useState(0);
    const [calculatedValue, setCalculatedValue] = useState(0);

    const hasChanges = useRef(false);

    useEffect(() => {
        if (maxLevel && !currentValue) {
            const sliderValue = usePercentage ? convertToPercentage(value, maxLevel) : value;
            setCurrentValue(sliderValue);
            setCalculatedValue(value);
        }
    }, [currentValue, maxLevel, usePercentage, value]);

    const maxValue = usePercentage ? 100 : maxLevel;

    const getPosition = useCallback(
        (value: number, max: number) => {
            // Position the value bubble in the range input thumb
            return 15 + ((value - min) / (max - min)) * (SLIDER_WIDTH - SLIDER_THUMB_WIDTH);
        },
        [min]
    );

    // Check if the value is over 75% of the max level
    const hasWarning = (currentValue * 100) / maxValue > 75;

    const handleMouseUp = useCallback(() => {
        setIsHover(false);

        if (!isLoading && hasChanges.current) {
            onChange(calculatedValue);
            hasChanges.current = false;
        }
    }, [calculatedValue, isLoading, onChange]);

    const handleMouseDown = () => {
        setIsHover(true);
    };

    const handleChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const newValue = Number(event.target.value);
            setCurrentValue(newValue);
            const newCalculatedValue = usePercentage ? convertToUnit(newValue, maxLevel) : newValue;
            setCalculatedValue(newCalculatedValue);
            hasChanges.current = true;
        },
        [maxLevel, usePercentage]
    );

    const valueBasedStyles = useMemo(() => {
        // these should all be percentage based for styling values
        const _maxVal = 100;
        const comparisonValue = convertToPercentage(currentValue, maxValue);
        return {
            rangeValueHolder: {
                left: getPosition(comparisonValue, _maxVal),
                display: isHover ? 'block' : 'none',
            },
            ecomark: {
                display: comparisonValue > comparisonValue && comparisonValue < 18 ? 'none' : 'block',
                left: 15 + ((15 - min) / (_maxVal - min)) * (SLIDER_WIDTH - SLIDER_THUMB_WIDTH),
            },
            firemark: {
                display: comparisonValue > 72 && comparisonValue < 78 ? 'none' : 'block',
                left: 15 + ((75 - min) / (_maxVal - min)) * (SLIDER_WIDTH - SLIDER_THUMB_WIDTH),
            },
            rangeValue: {
                background: comparisonValue
                    ? `linear-gradient(to right, #813bf5 ${comparisonValue || 1}%, #ddd ${comparisonValue || 1}%)`
                    : '#ddd',
            },
        };
    }, [currentValue, getPosition, isHover, maxValue, min]);

    if (!maxValue) return null;
    return (
        <>
            <InputContainer>
                <RangeLabel> {label}</RangeLabel>
                <RangeInputWrapper
                    onMouseDown={handleMouseDown}
                    onMouseEnter={handleMouseDown}
                    onMouseLeave={() => setIsHover(false)}
                    onMouseUp={handleMouseUp}
                >
                    <RangeLimits>{usePercentage ? '0%' : '0'}</RangeLimits>
                    <RangeInputHolder $disabled={isLoading}>
                        <PerformanceMarker style={valueBasedStyles.ecomark} />
                        <PerformanceMarker $red style={valueBasedStyles.firemark} />
                        <RangeValueHolder style={valueBasedStyles.rangeValueHolder}>
                            {usePercentage ? `${currentValue}%` : currentValue}
                        </RangeValueHolder>
                        <RangeInput
                            step={step}
                            type="range"
                            value={currentValue}
                            style={valueBasedStyles.rangeValue}
                            max={maxValue}
                            min={min}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </RangeInputHolder>
                    <RangeLimits>{usePercentage ? `${maxValue}%` : maxValue}</RangeLimits>
                </RangeInputWrapper>
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
        </>
    );
};

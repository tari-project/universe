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
    onChange: (value: number) => void;
}
export const RangeInputComponent = ({
    label,
    maxLevel,
    value,
    desc,
    onChange,
    warning,
    isLoading = false,
    usePercentage = false,
}: RangeInputProps) => {
    const min = 1;
    const [isHover, setIsHover] = useState(false);
    const { t } = useTranslation('settings', { useSuspense: true });

    const [currentValue, setCurrentValue] = useState(0);
    const [calculatedValue, setCalculatedValue] = useState(0);

    const hasChanges = useRef(false);

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
            const calculatedValue = Math.ceil((newValue * maxLevel) / 100);
            setCalculatedValue(calculatedValue);
            hasChanges.current = true;
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
        <>
            <InputContainer>
                <RangeLabel> {label}</RangeLabel>
                <RangeInputWrapper
                    onMouseDown={handleMouseDown}
                    onMouseEnter={handleMouseDown}
                    onMouseLeave={() => setIsHover(false)}
                    onMouseUp={handleMouseUp}
                >
                    <RangeLimits>{'0%'}</RangeLimits>
                    <RangeInputHolder $disabled={isLoading}>
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
                            disabled={isLoading}
                        />
                    </RangeInputHolder>
                    <RangeLimits>{`${maxValue}%`}</RangeLimits>
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

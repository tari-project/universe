import { useCallback, useMemo, useRef, useState, ChangeEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
    InputContainer,
    InputDescription,
    InputVal,
    PerformanceMarker,
    RangeInput,
    RangeInputHolder,
    RangeInputSteps,
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

export const RangeInputComponent = ({
    label,
    maxLevel,
    value,
    desc,
    onChange,
    warning,
    step = 1,
    isLoading = false,
    usePercentage = false,
}: RangeInputProps) => {
    const min = step ?? 1;
    const [isHover, setIsHover] = useState(false);
    const { t } = useTranslation('settings', { useSuspense: true });

    const [currentValue, setCurrentValue] = useState(value);

    const hasChanges = useRef(false);

    // Check if the value is over 75% of the max level
    const hasWarning = convertToPercentage(currentValue, maxLevel) > 75;

    const handleMouseUp = useCallback(() => {
        setIsHover(false);

        if (!isLoading && hasChanges.current) {
            onChange(currentValue);
            hasChanges.current = false;
        }
    }, [currentValue, isLoading, onChange]);

    const handleMouseDown = () => {
        setIsHover(true);
    };

    const handleChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const newValue = Number(event.target.value);
            console.debug(`newValue= ${newValue}`);
            setCurrentValue(newValue >= min ? newValue : min);
            hasChanges.current = true;
        },
        [min]
    );

    const valueBasedStyles = useMemo(() => {
        // these should all be percentage based for styling values
        const _maxVal = 100;
        const comparisonValue = convertToPercentage(currentValue, maxLevel);
        return {
            rangeValueHolder: {
                left: `${comparisonValue}%`,
                display: isHover ? 'block' : 'none',
            },
            ecomark: {
                display: comparisonValue > comparisonValue && comparisonValue < 18 ? 'none' : 'block',
                left: ((15 - min) / (_maxVal - min)) * (SLIDER_WIDTH - SLIDER_THUMB_WIDTH),
            },
            firemark: {
                display: comparisonValue > 72 && comparisonValue < 78 ? 'none' : 'block',
                left: ((75 - min) / (_maxVal - min)) * (SLIDER_WIDTH - SLIDER_THUMB_WIDTH),
            },
            rangeValue: {
                width: `${comparisonValue}%`,
                left: comparisonValue,
            },
        };
    }, [currentValue, isHover, maxLevel, min]);
    if (!maxLevel) return null;
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
                    <RangeLimits>0</RangeLimits>
                    <RangeInputHolder $disabled={isLoading}>
                        <RangeValueHolder style={valueBasedStyles.rangeValueHolder}>
                            {usePercentage ? `${currentValue}%` : currentValue}
                        </RangeValueHolder>
                        <RangeInput
                            step={step}
                            type="range"
                            value={currentValue}
                            max={maxLevel}
                            min={0}
                            onChange={handleChange}
                            disabled={isLoading}
                            $thumbLeft={valueBasedStyles.rangeValue.left}
                        />
                        <InputVal style={{ width: valueBasedStyles.rangeValue.width }} />
                        <PerformanceMarker style={valueBasedStyles.ecomark} />
                        <PerformanceMarker $red style={valueBasedStyles.firemark} />
                    </RangeInputHolder>
                    <RangeLimits>{maxLevel}</RangeLimits>
                </RangeInputWrapper>
                <InputDescription>
                    <Trans
                        i18nKey={desc}
                        ns="settings"
                        values={{
                            current: currentValue.toString(),
                            max: maxLevel.toString(),
                        }}
                        components={{ span: <span /> }}
                    />
                </InputDescription>
            </InputContainer>
            <WarningContainer $visible={hasWarning}>
                <strong>{t('custom-power-levels.warning')}</strong>: {warning}
            </WarningContainer>
        </>
    );
};

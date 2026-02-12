import { useEffect, useRef, useState } from 'react';
import { animate, useMotionValue, useTransform } from 'motion/react';
import {
    PerformanceMarker,
    Range,
    RangeLimits,
    Slider,
    SliderWrapper,
    Thumb,
    Track,
    TrackWrapper,
    ValueIndicator,
    Wrapper,
} from './styles.ts';
import useDebouncedValue from '@app/hooks/helpers/useDebounce.ts';

interface SliderProps {
    defaultValue: number;
    maxValue: number;
    isStepped?: boolean;
    stepSize?: number;
    onChange: (value: number) => void;
    startingValue?: number;
    performanceMarkers?: boolean;
    isLoading?: boolean;
    testId?: string;
}
export function SliderInput({
    defaultValue = 0,
    startingValue = 0,
    isStepped = false,
    performanceMarkers = false,
    isLoading = false,
    maxValue,
    stepSize = 1,
    onChange,
    testId,
}: SliderProps) {
    const [value, setValue] = useState(defaultValue);
    const deferredValue = useDebouncedValue(value, 200);
    const sliderRef = useRef<HTMLDivElement>(null);

    const scale = useMotionValue(1);

    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    const handlePointerMove = (e) => {
        if (e.buttons > 0 && sliderRef.current) {
            const { left, width } = sliderRef.current.getBoundingClientRect();
            let newValue = startingValue + ((e.clientX - left) / width) * (maxValue - startingValue);

            if (isStepped) {
                newValue = Math.round(newValue / stepSize) * stepSize;
            }

            newValue = Math.min(Math.max(newValue, startingValue), maxValue);
            setValue(newValue);
        }
    };

    useEffect(() => {
        onChange(deferredValue);
    }, [deferredValue, onChange]);

    const handlePointerDown = (e) => {
        handlePointerMove(e);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const getRangePercentage = (valueArg?: number) => {
        const comparisonValue = valueArg || value;

        const totalRange = maxValue - startingValue;
        if (totalRange === 0) return 0;

        return ((comparisonValue - startingValue) / totalRange) * 100;
    };

    return (
        <Wrapper $isLoading={isLoading}>
            <RangeLimits>{`${startingValue}%`}</RangeLimits>

            <SliderWrapper
                $isLoading={isLoading}
                onHoverStart={() => animate(scale, 1.02)}
                onHoverEnd={() => animate(scale, 1)}
                onTouchStart={() => animate(scale, 1.02)}
                onTouchEnd={() => animate(scale, 1)}
                style={{
                    scale,
                }}
            >
                <Slider ref={sliderRef} data-testid={testId} onPointerMove={handlePointerMove} onPointerDown={handlePointerDown}>
                    <ValueIndicator
                        style={{
                            left: `${getRangePercentage()}%`,
                            opacity: useTransform(scale, [1, 1.01], [0, 1]),
                        }}
                    >
                        {value}
                    </ValueIndicator>
                    <TrackWrapper
                        style={{
                            height: useTransform(scale, [1, 1.02], [6, 12]),
                            marginTop: useTransform(scale, [1, 1.02], [0, -3]),
                            marginBottom: useTransform(scale, [1, 1.02], [0, -3]),
                        }}
                    >
                        <Thumb
                            style={{
                                left: `${getRangePercentage()}%`,
                            }}
                        />
                        <Track>
                            <Range
                                style={{
                                    width: `${getRangePercentage()}%`,
                                    opacity: useTransform(scale, [1, 1.05], [0.9, 1]),
                                }}
                            />
                        </Track>
                        {performanceMarkers && (
                            <>
                                <PerformanceMarker />
                                <PerformanceMarker $red />
                            </>
                        )}
                    </TrackWrapper>
                </Slider>
            </SliderWrapper>
            <RangeLimits>{`${maxValue}%`}</RangeLimits>
        </Wrapper>
    );
}

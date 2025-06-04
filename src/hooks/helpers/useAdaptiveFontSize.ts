import { useState, useEffect, RefObject } from 'react';

interface UseAdaptiveFontSizeOptions {
    inputValue: string;
    inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>; // Can be input or textarea
    minFontSize?: number;
    maxFontSize?: number;
    containerWidth?: number;
    horizontalPadding?: number;
}

export const useAdaptiveFontSize = ({
    inputValue,
    inputRef,
    minFontSize = 14,
    maxFontSize = 28,
    containerWidth,
    horizontalPadding = 10, // Default to 10px for the right margin you had
}: UseAdaptiveFontSizeOptions): number => {
    const [dynamicFontSize, setDynamicFontSize] = useState(maxFontSize);

    useEffect(() => {
        const inputElement = inputRef.current;
        if (!inputElement) {
            // If input element is not yet available, reset to max or do nothing
            // setDynamicFontSize(maxFontSize); // Or handle as per your preference
            return;
        }

        // Create a temporary measurer span if it doesn't exist or reuse
        let measurer = document.getElementById('__font_size_measurer');
        if (!measurer) {
            measurer = document.createElement('span');
            measurer.id = '__font_size_measurer';
            measurer.style.visibility = 'hidden';
            measurer.style.position = 'absolute';
            measurer.style.whiteSpace = 'nowrap';
            measurer.style.top = '-9999px'; // Move it off-screen
            measurer.style.left = '-9999px';
            document.body.appendChild(measurer);
        }

        // Copy font properties from the input to the measurer
        const computedStyle = window.getComputedStyle(inputElement);
        measurer.style.fontFamily = computedStyle.fontFamily;
        measurer.style.fontWeight = computedStyle.fontWeight;
        measurer.style.letterSpacing = computedStyle.letterSpacing;
        measurer.style.padding = '0'; // Measurer should have no padding itself

        // Use '0' or a placeholder if value is empty to prevent font size from becoming too small or large
        const textToMeasure = inputValue || '0';
        measurer.textContent = textToMeasure;

        const availableWidth = (containerWidth ?? inputElement.clientWidth) - horizontalPadding;

        if (availableWidth <= 0) {
            // If no width, can't calculate
            setDynamicFontSize(maxFontSize);
            return;
        }

        let currentSize = maxFontSize;
        measurer.style.fontSize = `${currentSize}px`;

        // Shrink font size if text overflows
        while (measurer.scrollWidth > availableWidth && currentSize > minFontSize) {
            currentSize -= 1;
            measurer.style.fontSize = `${currentSize}px`;
        }

        // Expand font size if there's space (and text is not empty)
        // Only expand if the input value is not empty, to avoid large font for placeholder
        if (inputValue && measurer.scrollWidth < availableWidth && currentSize < maxFontSize) {
            while (measurer.scrollWidth < availableWidth && currentSize < maxFontSize) {
                const nextSize = currentSize + 1;
                measurer.style.fontSize = `${nextSize}px`;
                if (measurer.scrollWidth > availableWidth) {
                    measurer.style.fontSize = `${currentSize}px`; // Revert
                    break;
                }
                currentSize = nextSize;
            }
        }

        setDynamicFontSize(Math.max(minFontSize, currentSize));

        // Note: No cleanup for the measurer here to reuse it across multiple inputs.
        // If you prefer per-instance measurers, the cleanup logic from the previous example
        // should be brought back and the measurer should not have a fixed ID.
        // For simplicity and performance with multiple inputs, a single shared measurer is often fine.
    }, [inputValue, inputRef, minFontSize, maxFontSize, containerWidth, horizontalPadding]);

    return dynamicFontSize;
};

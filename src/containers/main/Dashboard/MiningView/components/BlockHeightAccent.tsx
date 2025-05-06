import { useEffect } from 'react';
import { useMotionValue, useTransform, useMotionValueEvent } from 'motion/react';

import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';
import { AccentText, AccentWrapper, SpacedNum } from './BlockHeightAccent.styles';

export function BlockHeightAccent() {
    const height = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
    const heightString = height?.toString();

    const heightStringArr = heightString?.split('') || [];

    const windowDimensions = useMotionValue({ height: window.innerHeight, width: window.innerWidth });
    const width = useMotionValue(170);
    const scale = useMotionValue(7.5);

    useEffect(() => {
        function handleResize() {
            windowDimensions.set({ height: window.innerHeight, width: window.innerWidth });
        }
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [windowDimensions]);

    const size = useTransform(() => {
        const { height, width } = windowDimensions.get();
        let dividend = (height - 110) / (heightStringArr.length >= 4 ? heightStringArr.length : 4);
        // checking discrepancy between height to mitigate overlap a bit
        if (Math.abs(height - width) < 190 && height / width >= 0.5) {
            dividend = dividend * 0.5;
        }
        return Math.floor(dividend);
    });

    useMotionValueEvent(size, 'change', (latest) => {
        width.set(latest);
        scale.set(Math.min(11, latest * 0.06));
    });

    return (
        <AccentWrapper style={{ width }}>
            <AccentText style={{ scale }}>
                {heightStringArr?.map((c, i) => (
                    <SpacedNum key={`spaced-char-${c}-${i}`} $isDec={isNaN(Number(c))}>
                        {c}
                    </SpacedNum>
                ))}
            </AccentText>
        </AccentWrapper>
    );
}

import { Column, MarkGroup, RulerMark, RulerMarkGroup, Wrapper } from './Ruler.styles.ts';
import { useTheme } from 'styled-components';
import { useLayoutEffect, useRef } from 'react';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';
import { useMotionValue } from 'motion/react';

export function Ruler() {
    const theme = useTheme();
    const height = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
    const windowWidth = useMotionValue(window.innerWidth);

    const columnRef = useRef<HTMLDivElement>(null);

    const topSegments = Array.from({ length: 16 }, (_, i) => i + 1);
    const rulerSegments = Array.from({ length: 14 }, (_, i) => i + 1);

    let heightSegment = height;

    const topMarkSegments = topSegments.map((segment, i) => {
        const groupOpacity = segment * 0.05;
        return (
            <MarkGroup key={`row-${segment}-${i}`} style={{ opacity: groupOpacity }}>
                <RulerMarkGroup>
                    <RulerMark $opacity={1} />
                    <RulerMark />
                    <RulerMark />
                    <RulerMark />
                    <RulerMark />
                </RulerMarkGroup>
            </MarkGroup>
        );
    });

    const bottomMarkSegments = rulerSegments.map((segment, i) => {
        const diff = height && height > 50 ? 10 : 5;
        const renderNumber = heightSegment && heightSegment > diff;

        if (renderNumber && heightSegment) {
            heightSegment -= diff;
        }

        const prevSegment = (heightSegment || 0) + diff;
        const groupOpacity = (rulerSegments.length * 1.25 - segment) * 0.075;
        const numberMark =
            heightSegment && heightSegment > diff && heightSegment != prevSegment
                ? heightSegment?.toLocaleString()
                : '';
        return (
            <MarkGroup key={`row-${segment}-${i}`} style={{ opacity: groupOpacity }}>
                <RulerMarkGroup>
                    <RulerMark $opacity={1} data-before={numberMark} />
                    <RulerMark />
                    <RulerMark />
                    <RulerMark />
                    <RulerMark />
                </RulerMarkGroup>
            </MarkGroup>
        );
    });

    useLayoutEffect(() => {
        function handleResize() {
            windowWidth.set(window.innerWidth);
        }
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [windowWidth]);

    return (
        <Wrapper>
            {height && height > 0 ? (
                <Column ref={columnRef}>
                    {topMarkSegments}
                    <RulerMarkGroup>
                        <RulerMark
                            $opacity={1}
                            data-before={height?.toLocaleString()}
                            animate={{
                                fontSize: windowWidth.get() < 1200 ? '18px' : '25px',
                                fontFamily: 'DrukWide, sans-serif',
                                color: theme.palette.text.primary,
                            }}
                        />
                        <RulerMark />
                        <RulerMark />
                        <RulerMark />
                        <RulerMark />
                    </RulerMarkGroup>
                    {bottomMarkSegments}
                </Column>
            ) : null}
        </Wrapper>
    );
}

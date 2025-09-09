import { useTheme } from 'styled-components';
import { useLayoutEffect, useRef } from 'react';
import { useMotionValue } from 'motion/react';
import { useBlockTip } from '@app/hooks/mining/useBlockTip.ts';
import { Column, MarkGroup, RulerMark, RulerMarkGroup, Wrapper } from './Ruler.styles.ts';

export function Ruler() {
    const theme = useTheme();
    const { data, isLoading } = useBlockTip();
    const height = data?.height ? Number(data?.height) : 0;
    const windowWidth = useMotionValue(window.innerWidth);

    const columnRef = useRef<HTMLDivElement>(null);

    const topSegments = Array.from({ length: 16 }, (_, i) => i + 1);
    const rulerSegments = Array.from({ length: 14 }, (_, i) => i + 1);

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
        let heightSegment = height;
        const diff = height && height > 50 ? 10 : 5;
        const renderNumber = heightSegment && heightSegment > diff;

        if (renderNumber && heightSegment) {
            heightSegment = heightSegment - diff * (i + 1);
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

    if (isLoading) return null;

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

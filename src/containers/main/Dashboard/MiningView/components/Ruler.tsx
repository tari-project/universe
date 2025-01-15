import { Column, MarkGroup, RulerMark, RulerMarkGroup, Wrapper } from './Ruler.styles.ts';
import { useTheme } from 'styled-components';
import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';

export function Ruler() {
    const theme = useTheme();
    const height = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const columnRef = useRef<HTMLDivElement>(null);

    const topSegments = Array.from({ length: 16 }, (_, i) => i + 1);
    const rulerSegments = Array.from({ length: 14 }, (_, i) => i + 1);

    let heightSegment = height;

    const topMarkSegments = topSegments.map((segment, i) => {
        const groupOpacity = segment * 0.05;
        return (
            <MarkGroup key={`row-${segment}-${i}`} style={{ opacity: groupOpacity }} layout>
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
            <MarkGroup key={`row-${segment}-${i}`} layout style={{ opacity: groupOpacity }}>
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
            setWindowWidth(window.innerWidth);
        }
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <Wrapper layoutId="ruler-wrapper">
            {height && height > 0 ? (
                <Column layoutId="ruler-column" ref={columnRef}>
                    {topMarkSegments}
                    <RulerMarkGroup layout>
                        <RulerMark
                            $opacity={1}
                            data-before={height?.toLocaleString()}
                            animate={{
                                fontSize: windowWidth < 1200 ? '18px' : '25px',
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

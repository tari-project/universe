import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useShallow } from 'zustand/react/shallow';
import {
    Accent,
    AccentText,
    AccentWrapper,
    SpacedNum,
} from '@app/containers/Dashboard/MiningView/components/BlockHeightAccent.styles.ts';
import { useDeferredValue, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup } from 'framer-motion';

export function BlockHeightAccent() {
    const height = useMiningStore(useShallow((s) => s.displayBlockHeight));
    const heightString = height?.toString();
    const containerRef = useRef<HTMLDivElement>(null);

    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    const [fontSize, setFontSize] = useState(0);
    const [textHeight, setTextHeight] = useState(containerRef.current?.offsetHeight);
    const heightStringArr = heightString?.split('') || [];

    const deferredHeight = useDeferredValue(windowHeight);
    const deferredFontSize = useDeferredValue(fontSize);

    useEffect(() => {
        const height = deferredHeight - 60;
        const dividend = (height - 100) / (heightStringArr.length >= 4 ? heightStringArr.length : 4);
        setFontSize(Math.floor(dividend));
    }, [heightStringArr.length, deferredHeight]);

    useLayoutEffect(() => {
        function handleResize() {
            setWindowHeight(window.innerHeight);
            if (containerRef.current?.offsetHeight) {
                setTextHeight(containerRef.current?.offsetHeight);
            }
        }
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <AccentWrapper layout>
            <LayoutGroup>
                <AnimatePresence mode="sync">
                    {window.innerHeight ? (
                        <Accent
                            $accentHeight={textHeight}
                            animate={{
                                width: `${textHeight}`,
                            }}
                        >
                            <AccentText
                                ref={containerRef}
                                animate={{
                                    fontSize: `${deferredFontSize || 110}px`,
                                }}
                            >
                                {heightStringArr?.map((c, i) => (
                                    <SpacedNum key={`spaced-char-${c}-${i}`}>{c}</SpacedNum>
                                ))}
                            </AccentText>
                        </Accent>
                    ) : null}
                </AnimatePresence>
            </LayoutGroup>
        </AccentWrapper>
    );
}

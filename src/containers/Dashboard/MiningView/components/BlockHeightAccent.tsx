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
    const containerRef = useRef<HTMLDivElement>(null);
    const height = useMiningStore(useShallow((s) => s.displayBlockHeight));
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    const [fontSize, setFontSize] = useState(0);
    const [textHeight, setTextHeight] = useState(containerRef.current?.offsetHeight);
    const heightString = height?.toString();
    const heightStringArr = heightString?.split('') || [];
    const deferredHeight = useDeferredValue(windowHeight || 110);
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
                <Accent
                    $accentHeight={textHeight}
                    animate={{
                        width: `${textHeight}px`,
                    }}
                >
                    <AccentText
                        ref={containerRef}
                        animate={{
                            fontSize: `${deferredFontSize}px`,
                        }}
                    >
                        <AnimatePresence mode="wait">
                            {Boolean(deferredFontSize) &&
                                heightStringArr?.map((c, i) => (
                                    <SpacedNum key={`spaced-char-${c}-${i}`}>{c}</SpacedNum>
                                ))}
                        </AnimatePresence>
                    </AccentText>
                </Accent>
            </LayoutGroup>
        </AccentWrapper>
    );
}

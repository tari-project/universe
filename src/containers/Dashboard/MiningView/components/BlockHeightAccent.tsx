import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useShallow } from 'zustand/react/shallow';
import {
    Accent,
    AccentText,
    AccentWrapper,
    SpacedNum,
} from '@app/containers/Dashboard/MiningView/components/BlockHeightAccent.styles.ts';
import { useDeferredValue, useEffect, useLayoutEffect, useRef, useState } from 'react';

export function BlockHeightAccent() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    const [textHeight, setTextHeight] = useState(containerRef.current?.offsetHeight || 110);
    const [fontSize, setFontSize] = useState(0);
    const height = useMiningStore(useShallow((s) => s.displayBlockHeight));
    const heightString = height?.toString();
    const heightStringArr = heightString?.split('') || [];
    const deferredValue = useDeferredValue(windowHeight);

    useEffect(() => {
        const height = deferredValue - 60;
        const dividend = (height - 100) / (heightStringArr.length >= 4 ? heightStringArr.length : 4);
        setFontSize(Math.floor(dividend));
    }, [heightStringArr.length, deferredValue]);

    useLayoutEffect(() => {
        function handleResize() {
            setWindowHeight(window.innerHeight);
            if (containerRef.current?.offsetHeight) {
                setTextHeight(containerRef.current?.offsetHeight);
            }
        }
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <AccentWrapper layout>
            <Accent
                layout
                $accentHeight={textHeight}
                animate={{
                    width: `${textHeight}px`,
                }}
            >
                <AccentText
                    layout
                    ref={containerRef}
                    animate={{
                        fontSize: `${fontSize}px`,
                    }}
                >
                    {heightStringArr?.map((c, i) => <SpacedNum key={`spaced-char-${c}-${i}`}>{c}</SpacedNum>)}
                </AccentText>
            </Accent>
        </AccentWrapper>
    );
}

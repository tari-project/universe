import { useMiningStore } from '@app/store/useMiningStore.ts';
import { useShallow } from 'zustand/react/shallow';
import {
    AccentText,
    AccentWrapper,
    SpacedNum,
} from '@app/containers/Dashboard/MiningView/components/BlockHeightAccent.styles.ts';
import { useDeferredValue, useEffect, useLayoutEffect, useState } from 'react';
import { LayoutGroup } from 'framer-motion';

export function BlockHeightAccent() {
    const height = useMiningStore(useShallow((s) => s.displayBlockHeight));
    const heightString = height?.toString();

    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    const [fontSize, setFontSize] = useState(0);
    const heightStringArr = heightString?.split('') || [];
    const deferredHeight = useDeferredValue(windowHeight);
    const deferredFontSize = useDeferredValue(fontSize || 120);

    useEffect(() => {
        const height = deferredHeight - 60;
        const dividend = (height - 100) / (heightStringArr.length >= 4 ? heightStringArr.length : 4);
        setFontSize(Math.floor(dividend));
    }, [heightStringArr.length, deferredHeight]);

    useLayoutEffect(() => {
        function handleResize() {
            setWindowHeight(window.innerHeight);
        }
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <AccentWrapper layoutId="accent-wrapper" style={{ width: deferredFontSize, top: 0, right: `-20px` }}>
            <LayoutGroup id="accent-content">
                <AccentText
                    layout
                    layoutId="accent-text"
                    style={{
                        fontSize: `${deferredFontSize}px`,
                        rotate: -90,
                    }}
                >
                    {heightStringArr?.map((c, i) => (
                        <SpacedNum layout key={`spaced-char-${c}-${i}`}>
                            {c}
                        </SpacedNum>
                    ))}
                </AccentText>
            </LayoutGroup>
        </AccentWrapper>
    );
}

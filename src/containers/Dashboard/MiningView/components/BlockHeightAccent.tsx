import {
    AccentText,
    AccentWrapper,
    SpacedNum,
} from '@app/containers/Dashboard/MiningView/components/BlockHeightAccent.styles.ts';
import { useDeferredValue, useEffect, useLayoutEffect, useState } from 'react';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';

export function BlockHeightAccent() {
    const height = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
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
            <AnimatePresence>
                {height && height > 0 ? (
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
                ) : null}
            </AnimatePresence>
        </AccentWrapper>
    );
}

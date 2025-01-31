import { useDeferredValue, useEffect, useLayoutEffect, useState } from 'react';
import { AnimatePresence, LayoutGroup } from 'motion/react';

import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';
import { AccentText, AccentWrapper, SpacedNum } from './BlockHeightAccent.styles';

export function BlockHeightAccent() {
    const height = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
    const heightString = height?.toString();

    const [windowHeight, setWindowHeight] = useState(window.innerHeight - 80);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [fontSize, setFontSize] = useState(0);
    const heightStringArr = heightString?.split('') || [];
    const deferredHeight = useDeferredValue(windowHeight);
    const deferredFontSize = useDeferredValue(fontSize || 110);

    useEffect(() => {
        let dividend = (deferredHeight - 70) / (heightStringArr.length >= 4 ? heightStringArr.length : 4);

        // checking discrepancy between height to mitigate overlap a bit
        if (Math.abs(deferredHeight - windowWidth) < 210 && deferredHeight / windowWidth >= 0.65) {
            dividend = dividend * 0.6;
        }
        const font = Math.floor(dividend);
        setFontSize(font);
    }, [heightStringArr.length, deferredHeight, windowWidth]);

    useLayoutEffect(() => {
        function handleResize() {
            setWindowHeight(window.innerHeight - 80);
            setWindowWidth(window.innerWidth);
        }
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <AccentWrapper layoutId="accent-wrapper" style={{ width: deferredFontSize }}>
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
                                <SpacedNum layout key={`spaced-char-${c}-${i}`} $isDec={isNaN(Number(c))}>
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

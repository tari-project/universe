import { useMiningStore } from '@app/store/useMiningStore.ts';
import {
    RulerContainer,
    RulerMarkContainer,
    RulerMark,
    Wrapper,
    RulerNumber,
    BlockHeightText,
    BlockHeightAccent,
} from './BlockHeight.styles';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { useBaseNodeStatusStore } from '@app/store/useBaseNodeStatusStore.ts';
import { useRef } from 'react';
import useWindowSize from '@app/hooks/helpers/useWindowSize.ts';
import { useGPUStatusStore } from '@app/store/useGPUStatusStore.ts';

export default function BlockHeight() {
    const isCPUMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const isGPUMining = useGPUStatusStore(useShallow((s) => s.is_mining));
    const isMining = isCPUMining || isGPUMining;

    const block_height = useBaseNodeStatusStore((s) => s.block_height);
    const displayBlockHeight = useMiningStore((s) => s.displayBlockHeight) ?? 0;
    const height = isMining ? displayBlockHeight : block_height;
    const formattedBlockHeight = height.toLocaleString();
    const windowSize = useWindowSize();
    const containerRef = useRef<HTMLDivElement>(null);

    const rulerSegments = [...Array(21)];
    const rulerMarks = [...Array(5)];
    const blankSegments = rulerSegments.map((_, i) =>
        rulerMarks.map((_, idx) => (
            <RulerMarkContainer key={`blank-mark-${i}${idx}`}>
                <div />
                <RulerMark style={{ opacity: idx == 0 ? 1 : 0.2 }} />
            </RulerMarkContainer>
        ))
    );

    let heightSegment = height;
    const heightSegments = [...Array(19)].map((_, i) => {
        return rulerMarks.map((_, idx) => {
            const diff = height > 50 ? 10 : 5;
            const renderNumber = Boolean(idx == 0) && heightSegment > diff;
            if (renderNumber) {
                heightSegment -= diff;
            }
            return (
                <RulerMarkContainer key={`ruler-${i}${idx}`}>
                    {renderNumber ? <RulerNumber>{heightSegment}</RulerNumber> : null}
                    <RulerMark style={{ opacity: idx == 0 ? 1 : 0.2 }} />
                </RulerMarkContainer>
            );
        });
    });
    const rulerMarkup = (
        <RulerContainer ref={containerRef} $height={containerRef.current?.offsetHeight}>
            {blankSegments}
            <BlockHeightText>{formattedBlockHeight}</BlockHeightText>
            {heightSegments}
        </RulerContainer>
    );

    return height > 0 ? (
        <Wrapper>
            <BlockHeightAccent
                $content={formattedBlockHeight ? `'${formattedBlockHeight}'` : ''}
                $height={
                    windowSize.height / ((formattedBlockHeight.length > 4 ? formattedBlockHeight.length : 4) * 100)
                }
            />
            {rulerMarkup}
        </Wrapper>
    ) : null;
}

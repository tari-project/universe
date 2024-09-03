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

export default function BlockHeight() {
    const isMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const block_height = useBaseNodeStatusStore((s) => s.block_height);
    const displayBlockHeight = useMiningStore((s) => s.displayBlockHeight) ?? 0;
    const height = isMining ? displayBlockHeight : block_height;
    const formattedBlockHeight = height.toLocaleString();

    const containerRef = useRef<HTMLDivElement>(null);

    const rulerSegments = [...Array(11)];
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
    const heightSegments = [...Array(9)].map((_, i) => {
        return rulerMarks.map((_, idx) => {
            const renderNumber = Boolean(idx == 0);
            if (renderNumber && heightSegment > 10) {
                heightSegment -= 10;
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
                $height={window.innerHeight / (formattedBlockHeight.length * 100)}
            />
            {rulerMarkup}
        </Wrapper>
    ) : null;
}

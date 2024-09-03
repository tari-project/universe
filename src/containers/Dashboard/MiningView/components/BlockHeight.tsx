import { useMiningStore } from '@app/store/useMiningStore.ts';
import {
    RulerContainer,
    RulerMarkContainer,
    RulerMark,
    Wrapper,
    RulerNumber,
    BlockHeightText,
} from './BlockHeight.styles';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { useBaseNodeStatusStore } from '@app/store/useBaseNodeStatusStore.ts';

export default function BlockHeight() {
    const isMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const block_height = useBaseNodeStatusStore((s) => s.block_height);
    const displayBlockHeight = useMiningStore((s) => s.displayBlockHeight) ?? 0;
    const formattedBlockHeight = displayBlockHeight.toLocaleString();
    const height = isMining ? displayBlockHeight : block_height;

    const rulerSegments = [...Array(10)];
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
    const heightSegments = rulerSegments.map((_, i) => {
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
        <RulerContainer>
            {blankSegments}
            <BlockHeightText>{formattedBlockHeight}s</BlockHeightText>
            {heightSegments}
        </RulerContainer>
    );

    return displayBlockHeight > 0 ? (
        <Wrapper>
            {rulerMarkup}
            {/*<BlockHeightBg id="BlockHeightBg" length={formattedBlockHeight.length}>*/}
            {/*    {formattedBlockHeight}*/}
            {/*</BlockHeightBg>*/}
            {/*<RulerAbsoluteWrapper id="RulerAbsoluteWrapper">*/}
            {/*    <RulerContainer id="RulerContainer">{renderRulerMarks()}</RulerContainer>*/}
            {/*</RulerAbsoluteWrapper>*/}
        </Wrapper>
    ) : null;
}

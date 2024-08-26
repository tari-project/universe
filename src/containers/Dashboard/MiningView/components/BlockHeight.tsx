import { useMiningStore } from '@app/store/useMiningStore.ts';
import {
    BlockHeightLrg,
    BlockHeightSml,
    BlockHeightContainer,
    RulerContainer,
    RulerMarkContainer,
    RulerMark,
    BlockHeightBg,
} from './BlockHeight.styles';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';
import { useBaseNodeStatusStore } from '@app/store/useBaseNodeStatusStore.ts';

function BlockHeight() {
    const isMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const block_height = useBaseNodeStatusStore((s) => s.block_height);
    const displayBlockHeight = useMiningStore((s) => s.displayBlockHeight) ?? 0;
    const formattedBlockHeight = displayBlockHeight.toLocaleString();
    const height = isMining ? displayBlockHeight : block_height;
    const renderRulerMarks = () => {
        const marks = [];
        let rulerNum = height;
        for (let i = 0; i < 100; i++) {
            const opacity = i % 5 === 0 ? 1 : 0.2;
            marks.push(
                <RulerMarkContainer key={`mark-${i}`}>
                    <BlockHeightSml key={`height-${i}`}>
                        {i % 5 === 0 && i > 50 && rulerNum > 10 ? (rulerNum -= 10).toLocaleString() : null}
                    </BlockHeightSml>
                    <RulerMark key={`ruler-${i}`} style={{ opacity }} />
                </RulerMarkContainer>
            );
        }
        return marks;
    };

    return (
        <>
            <BlockHeightContainer>
                <BlockHeightBg length={formattedBlockHeight.length}>{formattedBlockHeight}</BlockHeightBg>
                <RulerContainer>{renderRulerMarks()}</RulerContainer>
                <BlockHeightLrg>{formattedBlockHeight}</BlockHeightLrg>
            </BlockHeightContainer>
        </>
    );
}

export default BlockHeight;

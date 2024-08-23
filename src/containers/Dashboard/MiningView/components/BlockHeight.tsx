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

function BlockHeight() {
    const displayBlockHeight = useMiningStore((s) => s.displayBlockHeight) ?? 0;
    const formattedBlockHeight = displayBlockHeight.toLocaleString();

    const renderRulerMarks = () => {
        const marks = [];
        let rulerNum = displayBlockHeight;
        for (let i = 0; i < 100; i++) {
            const opacity = i % 5 === 0 ? 1 : 0.2;
            marks.push(
                <RulerMarkContainer>
                    <BlockHeightSml key={i}>
                        {i % 5 === 0 && i > 50 && rulerNum > 10 ? (rulerNum -= 10).toLocaleString() : null}
                    </BlockHeightSml>
                    <RulerMark key={i} style={{ opacity }} />
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

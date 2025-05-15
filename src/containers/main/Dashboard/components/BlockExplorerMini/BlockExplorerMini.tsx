import { useState, useEffect, useRef } from 'react';
import { Wrapper, StickyEntryWrapper, LoadingPlaceholder, InsideHolder } from './styles';
import { BlockData, useBlocks } from './useBlocks';
import BlockEntry from './BlockEntry/BlockEntry';
import BlockScrollList from './BlockScrollList/BlockScrollList';

export default function BlockExplorerMini() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [stickyEntry, setStickyEntry] = useState<BlockData | null>(null);

    const { data, isLoading, isError } = useBlocks();

    useEffect(() => {
        if (data && data.length > 0) {
            setStickyEntry({
                ...data[0],
                id: (parseInt(data[0].id) + 1).toString(),
            });
        }
    }, [data]);

    if (isLoading) {
        return <LoadingPlaceholder />;
    }

    if (isError) {
        return <LoadingPlaceholder />;
    }

    return (
        <Wrapper ref={containerRef}>
            <InsideHolder>
                <StickyEntryWrapper>
                    {stickyEntry && (
                        <BlockEntry
                            key={stickyEntry.id}
                            id={stickyEntry.id}
                            minersSolved={stickyEntry.minersSolved}
                            reward={stickyEntry.reward}
                            timeAgo={stickyEntry.timeAgo}
                            isSolving={stickyEntry.isSolving}
                            blocks={stickyEntry.blocks}
                            isFirstEntry={true}
                        />
                    )}
                </StickyEntryWrapper>

                <BlockScrollList data={data} containerRef={containerRef} />
            </InsideHolder>
        </Wrapper>
    );
}

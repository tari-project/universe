import { Suspense, useState, useEffect, useRef } from 'react';
import { Wrapper, StickyEntryWrapper, LoadingPlaceholder, InsideHolder, BlockEntryPlaceholder } from './styles';
//import { useBlocks, BlockData } from '@/services/api/useBlocks';
import { BlockData } from './useBlocks';
import { initialBlockData } from './data';
import BlockEntry from './BlockEntry/BlockEntry';
import BlockScrollList from './BlockScrollList/BlockScrollList';

export default function BlockExplorerMini() {
    const data = initialBlockData;
    const isLoading = false;
    const isError = false;

    const [stickyEntry, setStickyEntry] = useState<BlockData | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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
                    <Suspense fallback={<BlockEntryPlaceholder />}>
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
                    </Suspense>
                </StickyEntryWrapper>

                <BlockScrollList data={data} containerRef={containerRef} />
            </InsideHolder>
        </Wrapper>
    );
}

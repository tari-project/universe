import { useState, useEffect, useRef } from 'react';
import { Wrapper, StickyEntryWrapper, LoadingPlaceholder, InsideHolder } from './styles';
import { BlockData, useBlocks } from './useBlocks';
import BlockEntry from './BlockEntry/BlockEntry';
import BlockScrollList from './BlockScrollList/BlockScrollList';
import { timeAgo } from './utils/formatting';

export default function BlockExplorerMini() {
    const { data, isLoading, isError } = useBlocks();

    const [stickyEntry, setStickyEntry] = useState<BlockData | null>(null);
    const [scrollList, setScrollList] = useState<BlockData[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        const updateStickyEntry = (isSolved: boolean) => {
            if (!data || data.length === 0) return null;
            return {
                ...data[0],
                id: (parseInt(data[0].id) + 1).toString(),
                timeAgo: timeAgo(data[0].timeAgo),
                isSolved,
            };
        };

        const updateScrollList = () => {
            if (!data || data.length === 0) return [];
            return data.map((block) => ({
                ...block,
                timeAgo: timeAgo(block.timeAgo),
            }));
        };

        if (data && data.length > 0) {
            if (isFirstRender.current) {
                setStickyEntry(updateStickyEntry(false));
                setScrollList(updateScrollList());
                isFirstRender.current = false;
            } else {
                setStickyEntry(updateStickyEntry(true));
                setTimeout(() => {
                    setStickyEntry((prev) => (prev ? { ...prev, isSolved: false } : null));
                    setScrollList(updateScrollList());
                }, 4000);
            }
        }

        const interval = setInterval(() => {
            if (data && data.length > 0) {
                setScrollList(updateScrollList());
            }
        }, 30000);

        return () => clearInterval(interval);
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
                            isSolved={stickyEntry.isSolved}
                            blocks={stickyEntry.blocks}
                            isFirstEntry={true}
                        />
                    )}
                </StickyEntryWrapper>

                <BlockScrollList data={scrollList} containerRef={containerRef} />
            </InsideHolder>
        </Wrapper>
    );
}

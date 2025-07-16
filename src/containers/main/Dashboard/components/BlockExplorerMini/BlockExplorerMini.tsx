import { useState, useEffect, useRef } from 'react';
import { BlockData } from '@app/types/mining/blocks.ts';
import { useFetchExplorerData } from '@app/hooks/mining/useFetchExplorerData.ts';
import BlockEntry from './BlockEntry/BlockEntry';
import BlockScrollList from './BlockScrollList/BlockScrollList';
import { timeAgo } from './utils/formatting';
import MinerCount from '@app/containers/main/Dashboard/components/BlockExplorerMini/MinerCount/MinerCount.tsx';
import { Wrapper, StickyEntryWrapper, LoadingPlaceholder, InsideHolder } from './styles';

export default function BlockExplorerMini() {
    const { data, isLoading, isError } = useFetchExplorerData();
    const blockBubblesData = data?.blockBubblesData;
    const [stickyEntry, setStickyEntry] = useState<BlockData | null>(null);
    const [scrollList, setScrollList] = useState<BlockData[]>([]);

    const isFirstRender = useRef(true);

    useEffect(() => {
        let stickyTimeout: NodeJS.Timeout;
        const updateStickyEntry = (isSolved: boolean) => {
            if (!blockBubblesData || blockBubblesData.length === 0) return null;
            return {
                ...blockBubblesData[0],
                id: (parseInt(blockBubblesData[0].id) + 1).toString(),
                timeAgo: timeAgo(blockBubblesData[0].timeAgo),
                isSolved,
            };
        };

        const updateScrollList = () => {
            if (!blockBubblesData || blockBubblesData.length === 0) return [];
            return blockBubblesData.map((block) => ({
                ...block,
                timeAgo: timeAgo(block.timeAgo),
            }));
        };

        if (blockBubblesData && blockBubblesData.length > 0) {
            if (isFirstRender.current) {
                setStickyEntry(updateStickyEntry(false));
                setScrollList(updateScrollList());
                isFirstRender.current = false;
            } else {
                setStickyEntry(updateStickyEntry(true));
                stickyTimeout = setTimeout(() => {
                    setStickyEntry((prev) => (prev ? { ...prev, isSolved: false } : null));
                    setScrollList(updateScrollList());
                }, 3 * 1000);
            }
        }

        const interval = setInterval(() => {
            if (blockBubblesData && blockBubblesData.length > 0) {
                setScrollList(updateScrollList());
            }
        }, 20 * 1000);

        return () => {
            clearInterval(interval);
            if (stickyTimeout) {
                clearTimeout(stickyTimeout);
            }
        };
    }, [blockBubblesData]);

    if (isLoading) {
        return <LoadingPlaceholder />;
    }

    if (isError) {
        return <LoadingPlaceholder />;
    }

    return (
        <Wrapper>
            <MinerCount />
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

                <BlockScrollList data={scrollList} />
            </InsideHolder>
        </Wrapper>
    );
}

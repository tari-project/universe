import { useState, useEffect, useRef } from 'react';
import { BlockData } from '@app/types/mining/blocks.ts';
import { useFetchExplorerData } from '@app/hooks/mining/useFetchExplorerData.ts';
import BlockEntry from './BlockEntry/BlockEntry';
import BlockScrollList from './BlockScrollList/BlockScrollList';
import { timeAgo } from './utils/formatting';
import MinerCount from '@app/containers/main/Dashboard/components/BlockExplorerMini/MinerCount/MinerCount.tsx';
import { Wrapper, StickyEntryWrapper, LoadingPlaceholder, InsideHolder } from './styles';
import { preload } from 'react-dom';

export const URL_BLOCK_SOLVED = `https://customer-o6ocjyfui1ltpm5h.cloudflarestream.com/852dac0dc91d50d399a7349dcc7316a1/manifest/video.m3u8`;
export const URL_BLOCK = `https://customer-o6ocjyfui1ltpm5h.cloudflarestream.com/3ed05f3d4fbfd3eec7c4bb911915d1c2/manifest/video.m3u8`;

export default function BlockExplorerMini() {
    preload(URL_BLOCK, { as: 'video' });
    preload(URL_BLOCK_SOLVED, { as: 'video' });

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

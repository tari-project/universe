import { useQuery } from '@tanstack/react-query';

export const BLOCKS_KEY = ['blocks'];
const address = 'https://textexplore.tari.com';

interface Blocks {
    height: string;
    timestamp: string;
    outputs: number;
    totalCoinbaseXtm: string;
    numCoinbases: number;
    numOutputsNoCoinbases: number;
    numInputs: number;
    powAlgo: string;
}

interface Headers {
    height: string;
    timestamp: string;
}

interface BlocksStats {
    stats: Blocks[];
    headers: Headers[];
}

export interface BlockData {
    id: string;
    minersSolved: number;
    reward?: number; // XTM reward amount
    timeAgo: string;
    isSolved?: boolean;
    blocks?: number;
    isFirstEntry?: boolean;
}

async function fetchBlockStats(): Promise<BlocksStats> {
    const response = await fetch(`${address}/?json`);

    if (!response.ok) {
        throw new Error('Failed to fetch blocks');
    }

    return response.json();
}

export function useBlocks() {
    return useQuery<BlockData[]>({
        queryKey: BLOCKS_KEY,
        queryFn: async () => {
            const blocks = await fetchBlockStats();
            return blocks.stats.slice(0, 10).map((block) => ({
                id: block.height,
                minersSolved: block.numCoinbases,
                reward: parseInt(block.totalCoinbaseXtm.split('.')[0].replace(/,/g, ''), 10),
                timeAgo: block.timestamp,
                blocks: block.numOutputsNoCoinbases,
                isSolved: false,
            }));
        },
        refetchOnWindowFocus: true,
        refetchInterval: 30000,
    });
}

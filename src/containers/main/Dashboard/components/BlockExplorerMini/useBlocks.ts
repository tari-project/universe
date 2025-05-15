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

interface BlocksStats {
    stats: Blocks[];
}

export interface BlockData {
    id: string;
    minersSolved: number;
    reward?: number; // XTM reward amount
    timeAgo?: string;
    isSolving?: boolean;
    blocks?: number;
    isFirstEntry?: boolean;
}

async function fetchBlockStats(): Promise<BlocksStats> {
    const response = await fetch(`${address}/stats/?json`);

    if (!response.ok) {
        return { stats: [] };
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
                timeAgo: undefined, // Waiting for the API to provide this data
                blocks: block.numOutputsNoCoinbases,
                isSolving: true,
            }));
        },
        refetchOnWindowFocus: true,
        refetchInterval: 5000,
    });
}

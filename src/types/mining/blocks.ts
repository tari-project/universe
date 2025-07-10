interface Block {
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

export interface BlocksStats {
    stats: Block[];
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

export interface BlockDataExtended extends Block {
    parsedTimestamp?: string;
}

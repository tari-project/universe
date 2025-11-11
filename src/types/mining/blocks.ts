export interface BlockStats {
    height: number;
    totalCoinbaseXtm: string;
    numCoinbases: number;
    numOutputsNoCoinbases: number;
    numInputs: number;
    powAlgo: string;
    timestamp: number;
}

export interface BlockBubbleData extends Partial<BlockStats> {
    id: string;
    minersSolved: number;
    reward?: number; // XTM reward amount
    timeAgo?: string;
    isSolved?: boolean;
    blocks?: number;
    isFirstEntry?: boolean;
}

export interface BlockTip {
    height: number;
    timestamp: number;
}

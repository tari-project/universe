export interface BlockStats {
    height: number;
    totalCoinbaseXtm: string;
    numCoinbases: number;
    numOutputsNoCoinbases: number;
    numInputs: number;
    powAlgo: string;
    timestamp: number;
}

export interface LocalBlockStats {
    height: number;
    total_coinbase_xtm: string;
    num_coinbases: number;
    num_outputs_no_coinbases: number;
    num_inputs: number;
    pow_algo: string;
    timestamp: number;
}

export function localBlockStatsToBlockStats(local: LocalBlockStats): BlockStats {
    return {
        height: local.height,
        totalCoinbaseXtm: local.total_coinbase_xtm,
        numCoinbases: local.num_coinbases,
        numOutputsNoCoinbases: local.num_outputs_no_coinbases,
        numInputs: local.num_inputs,
        powAlgo: local.pow_algo,
        timestamp: local.timestamp,
    };
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

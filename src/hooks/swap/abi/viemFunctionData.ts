// --- Router ABIs for viem's encodeFunctionData ---

// --- EXACT INPUT ---
export const SWAP_EXACT_ETH_FOR_TOKENS_ABI_VIEM = [
    {
        type: 'function',
        name: 'swapExactETHForTokens',
        inputs: [
            { name: 'amountOutMin', type: 'uint256' },
            { name: 'path', type: 'address[]' },
            { name: 'to', type: 'address' },
            { name: 'deadline', type: 'uint256' },
        ],
        outputs: [{ name: 'amounts', type: 'uint256[]' }],
        stateMutability: 'payable',
    },
] as const;

export const SWAP_EXACT_TOKENS_FOR_ETH_ABI_VIEM = [
    {
        type: 'function',
        name: 'swapExactTokensForETH',
        inputs: [
            { name: 'amountIn', type: 'uint256' },
            { name: 'amountOutMin', type: 'uint256' },
            { name: 'path', type: 'address[]' },
            { name: 'to', type: 'address' },
            { name: 'deadline', type: 'uint256' },
        ],
        outputs: [{ name: 'amounts', type: 'uint256[]' }],
        stateMutability: 'nonpayable',
    },
] as const;

export const SWAP_EXACT_TOKENS_FOR_TOKENS_ABI_VIEM = [
    {
        type: 'function',
        name: 'swapExactTokensForTokens',
        inputs: [
            { name: 'amountIn', type: 'uint256' },
            { name: 'amountOutMin', type: 'uint256' },
            { name: 'path', type: 'address[]' },
            { name: 'to', type: 'address' },
            { name: 'deadline', type: 'uint256' },
        ],
        outputs: [{ name: 'amounts', type: 'uint256[]' }],
        stateMutability: 'nonpayable',
    },
] as const;

// --- EXACT OUTPUT ---
export const SWAP_ETH_FOR_EXACT_TOKENS_ABI_VIEM = [
    {
        type: 'function',
        name: 'swapETHForExactTokens',
        inputs: [
            { name: 'amountOut', type: 'uint256' }, // Exact amount of tokens to receive
            { name: 'path', type: 'address[]' },
            { name: 'to', type: 'address' },
            { name: 'deadline', type: 'uint256' },
        ],
        // msg.value will be the amountInMax (max ETH to spend)
        outputs: [{ name: 'amounts', type: 'uint256[]' }],
        stateMutability: 'payable',
    },
] as const;

export const SWAP_TOKENS_FOR_EXACT_ETH_ABI_VIEM = [
    {
        type: 'function',
        name: 'swapTokensForExactETH',
        inputs: [
            { name: 'amountOut', type: 'uint256' }, // Exact amount of ETH to receive
            { name: 'amountInMax', type: 'uint256' }, // Max amount of tokens to spend
            { name: 'path', type: 'address[]' },
            { name: 'to', type: 'address' },
            { name: 'deadline', type: 'uint256' },
        ],
        outputs: [{ name: 'amounts', type: 'uint256[]' }],
        stateMutability: 'nonpayable',
    },
] as const;

export const SWAP_TOKENS_FOR_EXACT_TOKENS_ABI_VIEM = [
    {
        type: 'function',
        name: 'swapTokensForExactTokens',
        inputs: [
            { name: 'amountOut', type: 'uint256' }, // Exact amount of output tokens to receive
            { name: 'amountInMax', type: 'uint256' }, // Max amount of input tokens to spend
            { name: 'path', type: 'address[]' },
            { name: 'to', type: 'address' },
            { name: 'deadline', type: 'uint256' },
        ],
        outputs: [{ name: 'amounts', type: 'uint256[]' }],
        stateMutability: 'nonpayable',
    },
] as const;

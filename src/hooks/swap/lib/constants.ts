import { ChainId, Token, Percent } from '@uniswap/sdk-core'; //WETH9,

import erc20Abi from '../abi/erc20.json';
import uniswapV2RouterAbi from '../abi/UniswapV2Router02.json';
import uniswapV2PairAbi from '../abi/UniswapV2Pair.json';
import {
    SWAP_ETH_FOR_EXACT_TOKENS_ABI_VIEM,
    SWAP_EXACT_ETH_FOR_TOKENS_ABI_VIEM,
    SWAP_EXACT_TOKENS_FOR_ETH_ABI_VIEM,
    SWAP_EXACT_TOKENS_FOR_TOKENS_ABI_VIEM,
    SWAP_TOKENS_FOR_EXACT_ETH_ABI_VIEM,
    SWAP_TOKENS_FOR_EXACT_TOKENS_ABI_VIEM,
} from '../abi/viemFunctionData';

export {
    erc20Abi,
    uniswapV2RouterAbi,
    uniswapV2PairAbi,
    SWAP_ETH_FOR_EXACT_TOKENS_ABI_VIEM,
    SWAP_EXACT_ETH_FOR_TOKENS_ABI_VIEM,
    SWAP_EXACT_TOKENS_FOR_ETH_ABI_VIEM,
    SWAP_EXACT_TOKENS_FOR_TOKENS_ABI_VIEM,
    SWAP_TOKENS_FOR_EXACT_ETH_ABI_VIEM,
    SWAP_TOKENS_FOR_EXACT_TOKENS_ABI_VIEM,
};

const ENABLED_NETWORKS = [ChainId.MAINNET, ChainId.SEPOLIA];

export const ROUTER_ADDRESSES: Partial<Record<ChainId, `0x${string}`>> = {
    [ChainId.MAINNET]: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    [ChainId.SEPOLIA]: '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3',
};

export enum EnabledTokensEnum {
    ETH = 'ETH',
    // WETH = 'wETH',
    WXTM = 'wXTM',
    USDT = 'USDT',
}

export const ENABLED_TOKEN_ADDRESSES = {
    // [EnabledTokensEnum.WETH]: {
    //     [ChainId.MAINNET]: '0x',
    //     [ChainId.SEPOLIA]: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
    // },
    [EnabledTokensEnum.WXTM]: {
        [ChainId.MAINNET]: '0xfD36fA88bb3feA8D1264fc89d70723b6a2B56958',
        // TEST SEPOLIA XTM
        // [ChainId.SEPOLIA]: '0x45388D68e2C2e8162259483498577296D2B5C8A0',
        // REAL SEPOLIA XTM
        [ChainId.SEPOLIA]: '0xcBe79AB990E0Ab45Cb9148db7d434477E49b7374',
    },
    [EnabledTokensEnum.USDT]: {
        [ChainId.MAINNET]: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        [ChainId.SEPOLIA]: '0x36e08a171866F92f1E990AB8a8F631839a633E4C',
    },
} as const;

export const RPC_URLS: Partial<Record<ChainId, string>> = {
    // TODO - have these on config - Infura might be needed
    [ChainId.MAINNET]: 'https://rwa.y.at/miner/rpc/mainnet',
    [ChainId.SEPOLIA]: 'https://rwa.y.at/miner/rpc/sepolia',
};

export const XTM_SDK_TOKEN: Partial<Record<ChainId, Token>> = {
    [ChainId.MAINNET]: new Token(
        ChainId.MAINNET,
        ENABLED_TOKEN_ADDRESSES[EnabledTokensEnum.WXTM][ChainId.MAINNET],
        18,
        EnabledTokensEnum.WXTM,
        'Tari'
    ),
    [ChainId.SEPOLIA]: new Token(
        ChainId.SEPOLIA,
        ENABLED_TOKEN_ADDRESSES[EnabledTokensEnum.WXTM][ChainId.SEPOLIA],
        18,
        EnabledTokensEnum.WXTM,
        'Tari'
    ),
};

export const USDT_SDK_TOKEN: Partial<Record<ChainId, Token>> = {
    [ChainId.MAINNET]: new Token(
        ChainId.MAINNET,
        ENABLED_TOKEN_ADDRESSES[EnabledTokensEnum.USDT][ChainId.MAINNET],
        6,
        EnabledTokensEnum.USDT,
        'USDT'
    ),
    [ChainId.SEPOLIA]: new Token(
        ChainId.SEPOLIA,
        ENABLED_TOKEN_ADDRESSES[EnabledTokensEnum.USDT][ChainId.SEPOLIA],
        6,
        EnabledTokensEnum.USDT,
        'USDT'
    ),
};

export const TOKEN_DEFINITIONS = {
    // [EnabledTokensEnum.WETH]: WETH9,
    [EnabledTokensEnum.WXTM]: XTM_SDK_TOKEN,
    [EnabledTokensEnum.USDT]: USDT_SDK_TOKEN,
};

export const KNOWN_SDK_TOKENS: Record<ChainId, Record<`0x${string}`, Token>> = Object.keys(
    ENABLED_TOKEN_ADDRESSES
).reduce(
    (acc, key) => {
        const tokenAddresses = ENABLED_TOKEN_ADDRESSES[key];
        for (const enabledNetwork of ENABLED_NETWORKS) {
            if (!acc[enabledNetwork]) acc[enabledNetwork] = {};

            const tokenAddress = tokenAddresses[enabledNetwork];
            const token = TOKEN_DEFINITIONS?.[key]?.[enabledNetwork];
            if (tokenAddress && token) {
                acc[enabledNetwork]![tokenAddress.toLowerCase() as `0x${string}`] = token;
            }
        }
        return acc;
    },
    {} as Record<ChainId, Record<`0x${string}`, Token>>
);

export const SLIPPAGE_TOLERANCE = new Percent('50', '10000'); // 0.5%
export const DEADLINE_MINUTES = 20;

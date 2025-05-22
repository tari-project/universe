import { ChainId, Token, WETH9, Percent } from '@uniswap/sdk-core';

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

export const ROUTER_ADDRESSES: Partial<Record<ChainId, `0x${string}`>> = {
    [ChainId.MAINNET]: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    [ChainId.GOERLI]: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    [ChainId.SEPOLIA]: '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3',
    [ChainId.POLYGON]: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
};

export enum EnabledTokensEnum {
    WETH = 'wETH',
    WXTM = 'wXTM',
}

export const ENABLED_TOKEN_ADDRESSES = {
    // Renamed for clarity
    [EnabledTokensEnum.WETH]: {
        [ChainId.MAINNET]: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        [ChainId.SEPOLIA]: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
    },
    [EnabledTokensEnum.WXTM]: {
        // TODO - change to mainnet address
        [ChainId.MAINNET]: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        [ChainId.SEPOLIA]: '0xcBe79AB990E0Ab45Cb9148db7d434477E49b7374',
    },
};

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

export const KNOWN_SDK_TOKENS: Partial<Record<ChainId, Record<`0x${string}`, Token>>> = {}; // Renamed
function initializeKnownSdkTokens() {
    for (const chainIdStr in ChainId) {
        const chainId = Number(chainIdStr) as ChainId;
        if (isNaN(chainId)) continue;
        KNOWN_SDK_TOKENS[chainId] = {};
        const weth = WETH9[chainId];
        if (weth) KNOWN_SDK_TOKENS[chainId]![weth.address.toLowerCase() as `0x${string}`] = weth;
        const xtm = XTM_SDK_TOKEN[chainId];
        if (xtm) KNOWN_SDK_TOKENS[chainId]![xtm.address.toLowerCase() as `0x${string}`] = xtm;
    }
}
initializeKnownSdkTokens();

export const SLIPPAGE_TOLERANCE = new Percent('50', '10000'); // 0.5%
export const DEADLINE_MINUTES = 20;

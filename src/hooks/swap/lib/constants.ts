import { ChainId, Token, Percent } from '@uniswap/sdk-core';

import erc20Abi from '../abi/erc20.json';

// V3 ABIs - You'll need to get these ABI files
import uniswapV3QuoterV2Abi from '../abi/IQuoterV2.json';
import uniswapV3FactoryAbi from '../abi/UniswapV3Factory.json';
import nonfungiblePositionManagerAbi from '../abi/INonFungiblePositionManager.json';
import swapRouter02AbiJson from '../abi/ISwapRouter02.json';

export { erc20Abi, uniswapV3QuoterV2Abi, swapRouter02AbiJson, uniswapV3FactoryAbi, nonfungiblePositionManagerAbi };

const ENABLED_NETWORKS = [ChainId.MAINNET, ChainId.SEPOLIA];

// Uniswap V3 Router02 address
export const QUOTER_ADDRESSES_V3: Partial<Record<ChainId, `0x${string}`>> = {
    [ChainId.MAINNET]: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    [ChainId.SEPOLIA]: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3',
};

export const FACTORY_ADDRESSES_V3: Partial<Record<ChainId, `0x${string}`>> = {
    [ChainId.MAINNET]: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    [ChainId.SEPOLIA]: '0x0227628f3F023bb0B980b67D528571c95c6DaC1c',
};

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES: Partial<Record<ChainId, `0x${string}`>> = {
    [ChainId.MAINNET]: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    [ChainId.SEPOLIA]: '0x1238536071E1c677A632429e3655c799b22cDA52',
};

export const V3_SWAP_ROUTER_ADDRESS: Partial<Record<ChainId, `0x${string}`>> = {
    [ChainId.MAINNET]: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    [ChainId.SEPOLIA]: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
};

export const DEADLINE_MINUTES = 20;
export const SLIPPAGE_TOLERANCE_PERCENT = new Percent(50, 10_000); // 0.5%
// ---

// Token contract addresses
export enum EnabledTokensEnum {
    ETH = 'ETH',
    WXTM = 'wXTM',
    USDT = 'USDT',
    USDC = 'USDC',
}

export const ENABLED_TOKEN_ADDRESSES = {
    [EnabledTokensEnum.WXTM]: {
        [ChainId.MAINNET]: '0xfD36fA88bb3feA8D1264fc89d70723b6a2B56958',
        [ChainId.SEPOLIA]: '0x45388D68e2C2e8162259483498577296D2B5C8A0',
    },
    [EnabledTokensEnum.USDT]: {
        [ChainId.MAINNET]: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        [ChainId.SEPOLIA]: '0x36e08a171866F92f1E990AB8a8F631839a633E4C',
    },
    [EnabledTokensEnum.USDC]: {
        [ChainId.MAINNET]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        [ChainId.SEPOLIA]: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
    },
} as const;

export const RPC_URLS: Partial<Record<ChainId, string>> = {
    [ChainId.MAINNET]: 'https://airdrop.tari.com/api/miner/rpc/mainnet',
    [ChainId.SEPOLIA]: 'https://airdrop.tari.com/api/miner/rpc/sepolia',
};

const handleSetupToken = (token: EnabledTokensEnum, decimals = 18, name: string): Partial<Record<ChainId, Token>> => {
    return {
        [ChainId.MAINNET]: new Token(
            ChainId.MAINNET,
            ENABLED_TOKEN_ADDRESSES[token][ChainId.MAINNET],
            decimals,
            token,
            name
        ),
        [ChainId.SEPOLIA]: new Token(
            ChainId.SEPOLIA,
            ENABLED_TOKEN_ADDRESSES[token][ChainId.SEPOLIA],
            decimals,
            token,
            name
        ),
    };
};

// --- These enable the options to use the token in the UI
export const XTM_SDK_TOKEN = handleSetupToken(EnabledTokensEnum.WXTM, 18, 'Tari');
export const USDT_SDK_TOKEN = handleSetupToken(EnabledTokensEnum.USDT, 6, 'USDT');
export const USDC_SDK_TOKEN = handleSetupToken(EnabledTokensEnum.USDC, 6, 'USDC');

export const TOKEN_DEFINITIONS = {
    [EnabledTokensEnum.WXTM]: XTM_SDK_TOKEN,
    [EnabledTokensEnum.USDT]: USDT_SDK_TOKEN,
    [EnabledTokensEnum.USDC]: USDC_SDK_TOKEN,
};
// ---

export const KNOWN_SDK_TOKENS: Record<ChainId, Record<`0x${string}`, Token>> = Object.keys(
    ENABLED_TOKEN_ADDRESSES
).reduce(
    (acc, key) => {
        const tokenAddresses = ENABLED_TOKEN_ADDRESSES[key as keyof typeof ENABLED_TOKEN_ADDRESSES];
        for (const enabledNetwork of ENABLED_NETWORKS) {
            if (!acc[enabledNetwork]) acc[enabledNetwork] = {};

            const tokenAddress = tokenAddresses[enabledNetwork as keyof typeof tokenAddresses];
            const tokenDef = TOKEN_DEFINITIONS[key as keyof typeof TOKEN_DEFINITIONS];
            const token = tokenDef?.[enabledNetwork as keyof typeof tokenDef];

            if (tokenAddress && token) {
                acc[enabledNetwork]![tokenAddress.toLowerCase() as `0x${string}`] = token;
            }
        }

        return acc;
    },
    {} as Record<ChainId, Record<`0x${string}`, Token>>
);

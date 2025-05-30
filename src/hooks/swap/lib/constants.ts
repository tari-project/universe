import { ChainId, Token, Percent } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';

import erc20Abi from '../abi/erc20.json';

// V3 ABIs - You'll need to get these ABI files
import uniswapV3PoolAbi from '../abi/IUniswapV3Pool.json';
import uniswapV3QuoterV2Abi from '../abi/IQuoterV2.json';
import universalRouterAbi from '../abi/UniversalRouter.json';
import uniswapV3FactoryAbi from '../abi/UniswapV3Factory.json';

export { erc20Abi, uniswapV3PoolAbi, uniswapV3QuoterV2Abi, universalRouterAbi, uniswapV3FactoryAbi };

const ENABLED_NETWORKS = [ChainId.MAINNET, ChainId.SEPOLIA];

export const UNIVERSAL_ROUTER_ADDRESSES: Partial<Record<ChainId, `0x${string}`>> = {
    [ChainId.MAINNET]: '0x66a9893cc07d91d95644aedd05d03f95e1dba8af',
    [ChainId.SEPOLIA]: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
};

export const QUOTER_ADDRESSES_V3: Partial<Record<ChainId, `0x${string}`>> = {
    [ChainId.MAINNET]: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    [ChainId.SEPOLIA]: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3',
};

export const FACTORY_ADDRESSES_V3: Partial<Record<ChainId, `0x${string}`>> = {
    [ChainId.MAINNET]: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    [ChainId.SEPOLIA]: '0x0227628f3F023bb0B980b67D528571c95c6DaC1c',
};

export const PERMIT2_ADDRESS: Partial<Record<ChainId, `0x${string}`>> = {
    [ChainId.MAINNET]: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
    [ChainId.SEPOLIA]: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
};

export const PERMIT2_SPENDER_ADDRESS: Partial<Record<ChainId, `0x${string}`>> = {
    [ChainId.MAINNET]: '0x66a9893cc07d91d95644aedd05d03f95e1dba8af',
    [ChainId.SEPOLIA]: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
};

export enum EnabledTokensEnum {
    ETH = 'ETH',
    WXTM = 'wXTM',
    USDT = 'USDT',
}

export const ENABLED_TOKEN_ADDRESSES = {
    [EnabledTokensEnum.WXTM]: {
        [ChainId.MAINNET]: '0xfD36fA88bb3feA8D1264fc89d70723b6a2B56958',
        [ChainId.SEPOLIA]: '0xcBe79AB990E0Ab45Cb9148db7d434477E49b7374',
    },
    [EnabledTokensEnum.USDT]: {
        [ChainId.MAINNET]: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        [ChainId.SEPOLIA]: '0x36e08a171866F92f1E990AB8a8F631839a633E4C',
    },
} as const;

export const RPC_URLS: Partial<Record<ChainId, string>> = {
    [ChainId.MAINNET]: 'https://airdrop.tari.com/api/miner/rpc/mainnet',
    [ChainId.SEPOLIA]: 'https://airdrop.tari.com/api/miner/rpc/sepolia',
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
    [EnabledTokensEnum.WXTM]: XTM_SDK_TOKEN,
    [EnabledTokensEnum.USDT]: USDT_SDK_TOKEN,
};

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

export const SLIPPAGE_TOLERANCE = new Percent('50', '10000'); // 0.5%
export const DEADLINE_MINUTES = 20;

// Default V3 Fee Tier to use. In a real app, you might want to query available pools or let user select.
export const DEFAULT_V3_POOL_FEE = FeeAmount.MEDIUM; // 0.3%

export const POOL_FACTORY_CONTRACT_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984';

// In constants.ts
export const SLIPPAGE_TOLERANCE_PERCENT = new Percent(50, 10_000); // 0.5%

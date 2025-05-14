import {
    ChainId,
    Token,
    WETH9,
    CurrencyAmount,
    TradeType,
    Percent,
    Ether,
    NativeCurrency,
    Price,
} from '@uniswap/sdk-core';
import { Pair, Route, Trade } from '@uniswap/v2-sdk';
import { useAccount, usePublicClient } from 'wagmi';
import { ethers, BrowserProvider, Contract, Signer as EthersSigner } from 'ethers';
import { useWalletClient } from 'wagmi';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { WalletClient, encodeFunctionData, formatUnits as viemFormatUnits } from 'viem';

// --- ABIs ---
import erc20Abi from './abi/erc20.json';
import uniswapV2RouterAbi from './abi/UniswapV2Router02.json';
import uniswapV2PairAbi from './abi/UniswapV2Pair.json';

export interface TradeDetails {
    trade: Trade<Token, Token, TradeType> | null;
    route: Route<Token, Token> | null;
    estimatedGasFeeNative?: string; // e.g., "0.005 ETH"
    estimatedGasFeeUSD?: string; // e.g., "$1.50"
    midPrice?: Price<Token, Token>;
    inputAmount?: CurrencyAmount<Token>;
    outputAmount?: CurrencyAmount<Token>;
}

export type SwapField = 'fromValue' | 'target';

// --- Constants ---
const ROUTER_ADDRESSES: Partial<Record<ChainId, `0x${string}`>> = {
    [ChainId.MAINNET]: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    [ChainId.GOERLI]: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Often same as Mainnet for tests
    [ChainId.SEPOLIA]: '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3', // Uniswap V2 Router address on Sepolia
    [ChainId.POLYGON]: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', // SushiSwap Router (commonly used as V2 Router on Polygon)
};

export enum EnabledTokens {
    DAI = 'DAI',
    WETH = 'wETH',
    XTM = 'wXTM',
    USDC = 'USDC',
}

export const ENABLED_TOKENS = {
    [EnabledTokens.DAI]: {
        [ChainId.MAINNET]: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        [ChainId.SEPOLIA]: '0x68194a729C2450ad26072b3D33ADaCbcef39D574',
    },
    [EnabledTokens.WETH]: {
        [ChainId.MAINNET]: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        [ChainId.SEPOLIA]: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
    },
    [EnabledTokens.XTM]: {
        // Replace with actual XTM addresses
        [ChainId.MAINNET]: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // Placeholder
        [ChainId.SEPOLIA]: '0x68194a729C2450ad26072b3D33ADaCbcef39D574', // Placeholder
    },
    [EnabledTokens.USDC]: {
        [ChainId.MAINNET]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        [ChainId.SEPOLIA]: '0x73d219B3881E481394DA6B5008A081d623992200', // Example, verify
    },
};

const PUBLIC_RPC_URLS: Partial<Record<ChainId, string>> = {
    [ChainId.MAINNET]: 'https://rpc.ankr.com/eth',
    [ChainId.SEPOLIA]: 'https://gateway.tenderly.co/public/sepolia',
};

export const DAI: Partial<Record<ChainId, Token>> = {
    [ChainId.MAINNET]: new Token(
        ChainId.MAINNET,
        ENABLED_TOKENS[EnabledTokens.DAI][ChainId.MAINNET],
        18,
        'DAI',
        'Dai Stablecoin'
    ),
    [ChainId.SEPOLIA]: new Token(
        ChainId.SEPOLIA,
        ENABLED_TOKENS[EnabledTokens.DAI][ChainId.SEPOLIA],
        18,
        'DAI',
        'Dai Stablecoin'
    ),
};
export const USDC: Partial<Record<ChainId, Token>> = {
    [ChainId.MAINNET]: new Token(
        ChainId.MAINNET,
        ENABLED_TOKENS[EnabledTokens.USDC][ChainId.MAINNET],
        6,
        'USDC',
        'USD Coin'
    ),
    [ChainId.SEPOLIA]: new Token(
        ChainId.SEPOLIA,
        ENABLED_TOKENS[EnabledTokens.USDC][ChainId.SEPOLIA],
        6,
        'USDC',
        'USD Coin'
    ),
};
export const XTM: Partial<Record<ChainId, Token>> = {
    // Replace with actual XTM Token object
    [ChainId.MAINNET]: new Token(
        ChainId.MAINNET,
        ENABLED_TOKENS[EnabledTokens.XTM][ChainId.MAINNET],
        18,
        'wXTM',
        'Your Token'
    ), // Example, update decimals/name
    [ChainId.SEPOLIA]: new Token(
        ChainId.SEPOLIA,
        ENABLED_TOKENS[EnabledTokens.XTM][ChainId.SEPOLIA],
        18,
        'wXTM',
        'Your Token'
    ), // Example, update decimals/name
};

const KNOWN_TOKENS: Partial<Record<ChainId, Record<`0x${string}`, Token>>> = {};
function initializeKnownTokens() {
    for (const chainIdStr in ChainId) {
        const chainId = Number(chainIdStr) as ChainId;
        if (isNaN(chainId)) continue;
        KNOWN_TOKENS[chainId] = {};
        const weth = WETH9[chainId];
        if (weth) KNOWN_TOKENS[chainId]![weth.address.toLowerCase() as `0x${string}`] = weth;
        const dai = DAI[chainId];
        if (dai) KNOWN_TOKENS[chainId]![dai.address.toLowerCase() as `0x${string}`] = dai;
        const usdc = USDC[chainId];
        if (usdc) KNOWN_TOKENS[chainId]![usdc.address.toLowerCase() as `0x${string}`] = usdc;
        const xtm = XTM[chainId];
        if (xtm) KNOWN_TOKENS[chainId]![xtm.address.toLowerCase() as `0x${string}`] = xtm;
    }
}

initializeKnownTokens();
const defaultChainId = process.env.NODE_ENV === 'development' ? ChainId.SEPOLIA : ChainId.MAINNET;

export async function walletClientToSigner(walletClient: WalletClient): Promise<EthersSigner | null> {
    const { account, chain, transport } = walletClient;
    if (!account || !chain || !transport) return null;
    try {
        const network = { chainId: chain.id, name: chain.name, ensAddress: chain.contracts?.ensRegistry?.address };
        const provider = new BrowserProvider(transport, network);
        return await provider.getSigner(account.address);
    } catch (e) {
        console.error('Error creating ethers signer:', e);
        return null;
    }
}

// --- Router ABIs for viem's encodeFunctionData ---
const SWAP_EXACT_ETH_FOR_TOKENS_ABI_VIEM = [
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
const SWAP_EXACT_TOKENS_FOR_ETH_ABI_VIEM = [
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
const SWAP_EXACT_TOKENS_FOR_TOKENS_ABI_VIEM = [
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

// --- Formatting Helpers for Gas Fees ---
const formatNativeGasFee = (
    gasAmountWei: bigint | undefined,
    nativeDecimals = 18,
    nativeSymbol = 'ETH'
): string | null => {
    if (gasAmountWei === undefined) return null;
    try {
        const formatted = viemFormatUnits(gasAmountWei, nativeDecimals);
        return `${parseFloat(formatted).toFixed(5)} ${nativeSymbol}`;
    } catch {
        return null;
    }
};
const formatGasFeeUSD = (feeInNativeNum: number | undefined, nativePriceUSD: number | undefined): string | null => {
    if (feeInNativeNum === undefined || nativePriceUSD === undefined) return null;
    const usdValue = feeInNativeNum * nativePriceUSD;
    return `$${usdValue.toFixed(2)}`;
};

const SLIPPAGE_TOLERANCE = new Percent('50', '10000'); // 0.5%
const DEADLINE_MINUTES = 20;

export const useSwap = () => {
    const [pairTokenAddress, setPairTokenAddress] = useState<`0x${string}` | null>(null);
    const [direction, setDirection] = useState<'input' | 'output'>('input');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isApproving, setIsApproving] = useState(false);
    const [isFetchingPair, setIsFetchingPair] = useState(false);

    const { address: accountAddress, isConnected, chain } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient(); // From wagmi, for read ops like estimateGas

    const currentChainId = useMemo(() => chain?.id || defaultChainId, [chain]);
    const routerAddress = useMemo(
        () => (currentChainId ? ROUTER_ADDRESSES[currentChainId] : undefined),
        [currentChainId]
    );
    const xtmToken = useMemo(() => (currentChainId ? XTM[currentChainId] : undefined), [currentChainId]);

    // Placeholder: Fetch this from a reliable oracle or API
    const nativeCurrencyPriceUSD = useMemo(() => 3000, []); // Example ETH price

    const publicRpcProvider = useMemo(() => {
        if (!currentChainId || !PUBLIC_RPC_URLS[currentChainId]) return null;
        try {
            return new ethers.JsonRpcProvider(PUBLIC_RPC_URLS[currentChainId], currentChainId);
        } catch (e) {
            console.error('Error creating public JsonRpcProvider:', e);
            return null;
        }
    }, [currentChainId]);

    const signerAsync = useMemo(async () => {
        if (!walletClient) return null;
        return walletClientToSigner(walletClient);
    }, [walletClient]);

    const providerAsync = useMemo(async () => {
        if (walletClient) {
            const signer = await signerAsync;
            if (signer?.provider) return signer.provider;
        }
        return publicRpcProvider;
    }, [publicRpcProvider, signerAsync, walletClient]);

    const sdkPairToken = useMemo(() => {
        if (!currentChainId) return undefined;
        const currentWeth = WETH9[currentChainId];
        if (pairTokenAddress === null) return currentWeth;
        const lowerCaseAddress = pairTokenAddress.toLowerCase() as `0x${string}`;
        return KNOWN_TOKENS[currentChainId]?.[lowerCaseAddress] || undefined;
    }, [pairTokenAddress, currentChainId]);

    const { sdkToken0, sdkToken1 } = useMemo(() => {
        const _sdkToken0 = direction === 'input' ? sdkPairToken : xtmToken;
        const _sdkToken1 = direction === 'input' ? xtmToken : sdkPairToken;
        return { sdkToken0: _sdkToken0, sdkToken1: _sdkToken1 };
    }, [sdkPairToken, xtmToken, direction]);

    const { token0, token1 } = useMemo(() => {
        if (!currentChainId) return { token0: undefined, token1: undefined };

        let uiInputToken: Token | NativeCurrency | undefined;
        let uiOutputToken: Token | NativeCurrency | undefined;

        // Determine the token the user selected for the "pair" side of the swap
        let selectedPairSideToken: Token | NativeCurrency | undefined;
        if (pairTokenAddress === null) {
            selectedPairSideToken = Ether.onChain(currentChainId); // User selected native ETH
        } else {
            const currentWeth = WETH9[currentChainId];
            // Check if pairTokenAddress is WETH address, return WETH Token, else lookup in KNOWN_TOKENS
            if (currentWeth && pairTokenAddress.toLowerCase() === currentWeth.address.toLowerCase()) {
                selectedPairSideToken = currentWeth; // User selected WETH explicitly
            } else {
                selectedPairSideToken = KNOWN_TOKENS[currentChainId]?.[pairTokenAddress.toLowerCase() as `0x${string}`];
            }
        }

        const xtmUiToken = xtmToken; // XTM is always an ERC20 Token for UI

        if (direction === 'input') {
            uiInputToken = selectedPairSideToken;
            uiOutputToken = xtmUiToken;
        } else {
            // direction === 'output'
            uiInputToken = xtmUiToken;
            uiOutputToken = selectedPairSideToken;
        }

        return { token0: uiInputToken, token1: uiOutputToken };
    }, [pairTokenAddress, xtmToken, direction, currentChainId]);

    const getPair = useCallback(
        async (preview?: boolean): Promise<Pair | null> => {
            if (!sdkToken0 || !sdkToken1 || !providerAsync || sdkToken0.chainId !== sdkToken1.chainId) {
                if (!preview) setError('Invalid token setup for pair.');
                return null;
            }
            setIsFetchingPair(true);
            setError(null);
            try {
                const provider = await providerAsync;
                if (!provider && !preview) throw new Error('Provider not available');
                // For V2, Pair.fetchData is often used. If implementing manually:
                const pairAddress = Pair.getAddress(sdkToken0, sdkToken1);
                const pairContract = new Contract(pairAddress, uniswapV2PairAbi, provider);
                const reserves = await pairContract['getReserves']();
                const [reserve0, reserve1] = [BigInt(reserves[0].toString()), BigInt(reserves[1].toString())];
                if (reserve0 === 0n && reserve1 === 0n && !preview) {
                    setError('Pair has no liquidity.');
                    setIsFetchingPair(false);
                    return null;
                }
                const pair = new Pair(
                    CurrencyAmount.fromRawAmount(sdkToken0, reserve0.toString()),
                    CurrencyAmount.fromRawAmount(sdkToken1, reserve1.toString())
                );
                setIsFetchingPair(false);
                return pair;
            } catch (e: any) {
                if (!preview) setError(`Failed to fetch pair: ${e.message}`);
                setIsFetchingPair(false);
                return null;
            }
        },
        [sdkToken0, sdkToken1, providerAsync]
    );

    const getTradeDetails = useCallback(
        async (
            amountRaw: string, // Expect raw amount string (e.g., '1000000000000000000')
            amountType: SwapField // Whether amountRaw is for input or output token
        ): Promise<TradeDetails> => {
            if (!publicClient || !accountAddress || !currentChainId || !sdkToken0 || !sdkToken1 || !routerAddress) {
                setError('Prerequisites for trade details not met.');
                return { trade: null, route: null };
            }
            if (!/^\d+$/.test(amountRaw) || BigInt(amountRaw) <= 0n) {
                setError('Invalid or zero amount provided.');
                return { trade: null, route: null };
            }

            const pair = await getPair(true); // Preview mode for getPair
            if (!pair) {
                if (!error) setError('Could not find liquidity pair for trade.');
                return { trade: null, route: null };
            }

            let trade: Trade<Token, Token, TradeType> | null = null;
            let route: Route<Token, Token> | null = null;

            try {
                route = new Route([pair], sdkToken0, sdkToken1); // sdkToken0 is always the input for the route
                if (amountType === 'fromValue') {
                    const currencyAmountIn = CurrencyAmount.fromRawAmount(sdkToken0, amountRaw);
                    trade = new Trade(route, currencyAmountIn, TradeType.EXACT_INPUT);
                } else {
                    // amountType === 'target'
                    const currencyAmountOut = CurrencyAmount.fromRawAmount(sdkToken1, amountRaw);
                    trade = new Trade(route, currencyAmountOut, TradeType.EXACT_OUTPUT);
                }
                setError(null);
            } catch (e: any) {
                console.error('Error creating trade object:', e);
                if (e.message?.includes('LIQUIDITY')) setError('Insufficient liquidity for this trade.');
                else setError(`Error calculating trade: ${e.message || 'Unknown error'}`);
                return { trade: null, route, inputAmount: trade?.inputAmount, outputAmount: trade?.outputAmount };
            }

            if (!trade) return { trade: null, route, inputAmount: undefined, outputAmount: undefined };

            let estimatedGasFeeNativeStr: string | null = null;
            let estimatedGasFeeUSDStr: string | null = null;

            try {
                const deadline = Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60;
                const path = route.path.map((token) => token.address as `0x${string}`);
                const amountIn = BigInt(trade.inputAmount.quotient.toString());
                const amountOut = BigInt(trade.outputAmount.quotient.toString());

                // For exact input, amountOut is minimumOutput. For exact output, amountIn is maximumInput.
                const amountOutMinOrMax =
                    trade.tradeType === TradeType.EXACT_INPUT
                        ? BigInt(trade.minimumAmountOut(SLIPPAGE_TOLERANCE).quotient.toString())
                        : amountOut; // For exact output, this is the exact amountOut
                const amountInOrMaxIn =
                    trade.tradeType === TradeType.EXACT_OUTPUT
                        ? BigInt(trade.maximumAmountIn(SLIPPAGE_TOLERANCE).quotient.toString())
                        : amountIn; // For exact input, this is the exact amountIn

                let callData: `0x${string}`;
                let valueToSend: bigint | undefined = undefined;
                let swapAbiForViem;

                const inputIsNativeForRouterEst = token0?.isNative;
                const outputIsNativeForRouterEst = token1?.isNative;

                // Note: Uniswap V2 Router does not have EXACT_OUTPUT for ETH input/output.
                // It has swapTokensForExactETH, swapETHForExactTokens which are less common.
                // This estimation primarily targets EXACT_INPUT type swaps.
                if (inputIsNativeForRouterEst) {
                    swapAbiForViem = SWAP_EXACT_ETH_FOR_TOKENS_ABI_VIEM;
                    callData = encodeFunctionData({
                        abi: swapAbiForViem,
                        functionName: 'swapExactETHForTokens',
                        args: [amountOutMinOrMax, path, accountAddress as `0x${string}`, BigInt(deadline)],
                    });
                    valueToSend = BigInt(amountInOrMaxIn.toString());
                } else if (outputIsNativeForRouterEst) {
                    swapAbiForViem = SWAP_EXACT_TOKENS_FOR_ETH_ABI_VIEM;
                    callData = encodeFunctionData({
                        abi: swapAbiForViem,
                        functionName: 'swapExactTokensForETH',
                        args: [
                            amountInOrMaxIn,
                            amountOutMinOrMax,
                            path,
                            accountAddress as `0x${string}`,
                            BigInt(deadline),
                        ],
                    });
                } else {
                    swapAbiForViem = SWAP_EXACT_TOKENS_FOR_TOKENS_ABI_VIEM;
                    callData = encodeFunctionData({
                        abi: swapAbiForViem,
                        functionName: 'swapExactTokensForTokens',
                        args: [
                            amountInOrMaxIn,
                            amountOutMinOrMax,
                            path,
                            accountAddress as `0x${string}`,
                            BigInt(deadline),
                        ],
                    });
                }

                const estimatedGasLimit = await publicClient.estimateGas({
                    account: accountAddress as `0x${string}`,
                    to: routerAddress,
                    data: callData,
                    value: valueToSend,
                });

                const gasPrice = await publicClient.getGasPrice();
                if (estimatedGasLimit && gasPrice) {
                    const estimatedTotalGasCostNative = estimatedGasLimit * gasPrice;
                    estimatedGasFeeNativeStr = formatNativeGasFee(
                        estimatedTotalGasCostNative,
                        publicClient.chain.nativeCurrency.decimals,
                        publicClient.chain.nativeCurrency.symbol
                    );
                    if (nativeCurrencyPriceUSD) {
                        const feeInNativeNum = parseFloat(
                            viemFormatUnits(estimatedTotalGasCostNative, publicClient.chain.nativeCurrency.decimals)
                        );
                        estimatedGasFeeUSDStr = formatGasFeeUSD(feeInNativeNum, nativeCurrencyPriceUSD);
                    }
                }
            } catch (gasError: any) {
                console.warn('Could not estimate gas for the swap preview:', gasError.shortMessage || gasError.message);
            }

            return {
                trade,
                route,
                estimatedGasFeeNative: estimatedGasFeeNativeStr || undefined,
                estimatedGasFeeUSD: estimatedGasFeeUSDStr || undefined,
                midPrice: route.midPrice,
                inputAmount: trade.inputAmount,
                outputAmount: trade.outputAmount,
            };
        },
        [
            publicClient,
            accountAddress,
            currentChainId,
            sdkToken0,
            sdkToken1,
            routerAddress,
            getPair,
            error,
            token0?.isNative,
            token1?.isNative,
            nativeCurrencyPriceUSD,
        ]
    );

    const checkAndRequestApproval = useCallback(
        async (amountToApproveRaw: string): Promise<boolean> => {
            if (!signerAsync || !accountAddress || !sdkToken0 || !routerAddress || !currentChainId) {
                setError('Approval prerequisites not met.');
                return false;
            }
            if (sdkToken0.isNative) {
                return true;
            } // No approval for native ETH

            setIsApproving(true);
            setError(null);
            const signer = await signerAsync;
            if (!signer) {
                setError('Signer not available.');
                setIsApproving(false);
                return false;
            }

            try {
                const tokenContract = new Contract(sdkToken0.address, erc20Abi, signer);
                const amountToApproveBI = BigInt(amountToApproveRaw); // Amount is already raw
                const currentAllowance = await tokenContract.allowance(accountAddress, routerAddress);

                if (BigInt(currentAllowance.toString()) < amountToApproveBI) {
                    const approveTx = await tokenContract.approve(routerAddress, amountToApproveBI);
                    const receipt = await approveTx.wait(1);
                    if (receipt?.status !== 1) throw new Error('Approval transaction failed.');
                }
                setIsApproving(false);
                return true;
            } catch (e: any) {
                console.error('Error during approval:', e);
                setError(`Approval failed: ${e?.reason || e?.message || 'User rejected'}`);
                setIsApproving(false);
                return false;
            }
        },
        [signerAsync, accountAddress, sdkToken0, routerAddress, currentChainId]
    );

    const executeSwap = useCallback(
        async (tradeToExecute: Trade<Token, Token, TradeType>): Promise<string | null> => {
            setError(null);
            setIsLoading(true);
            if (
                !signerAsync ||
                !accountAddress ||
                !isConnected ||
                !routerAddress ||
                !currentChainId ||
                !tradeToExecute ||
                !sdkToken0 ||
                !sdkToken1
            ) {
                setError('Swap prerequisites not met for execution.');
                setIsLoading(false);
                return null;
            }

            try {
                const amountIn = BigInt(tradeToExecute.inputAmount.quotient.toString());
                const amountOutMin = BigInt(tradeToExecute.minimumAmountOut(SLIPPAGE_TOLERANCE).quotient.toString());
                const path = tradeToExecute.route.path.map((token) => token.address as `0x${string}`);
                const to = accountAddress as `0x${string}`;
                const deadline = Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60;

                const inputIsNativeForRouter = token0?.isNative; // NEW: token0 is the UI input token
                const outputIsNativeForRouter = token1?.isNative; // NEW: token1 is the UI output token

                if (!inputIsNativeForRouter) {
                    // Check based on the UI selection
                    const approved = await checkAndRequestApproval(amountIn.toString());
                    if (!approved) {
                        setIsLoading(false);
                        return null;
                    }
                }

                const signer = await signerAsync;
                if (!signer) {
                    setError('Signer became unavailable.');
                    setIsLoading(false);
                    return null;
                }
                const routerContract = new Contract(routerAddress, uniswapV2RouterAbi, signer);

                const txOptions: { value?: bigint; gasLimit?: bigint } = {};
                let methodName: string;
                let methodArgs: any[];

                if (inputIsNativeForRouter) {
                    methodName = 'swapExactETHForTokens';
                    methodArgs = [amountOutMin, path, to, deadline];
                    txOptions.value = BigInt(amountIn.toString());
                } else if (outputIsNativeForRouter) {
                    methodName = 'swapExactTokensForETH';
                    methodArgs = [amountIn, amountOutMin, path, to, deadline];
                } else {
                    methodName = 'swapExactTokensForTokens';
                    methodArgs = [amountIn, amountOutMin, path, to, deadline];
                }

                // Optional: Gas Estimation for execution
                try {
                    const estimatedGas = await routerContract[methodName].estimateGas(...methodArgs, txOptions);
                    txOptions.gasLimit = (estimatedGas * 120n) / 100n; // 20% buffer
                } catch (gasError: any) {
                    console.warn('Gas estimation failed for executeSwap:', gasError.message);
                }

                const swapTxResponse = await routerContract[methodName](...methodArgs, txOptions);

                setIsLoading(false);
                return swapTxResponse.hash;
            } catch (error: any) {
                console.error('Error executing swap transaction:', error);
                const reason = error?.reason || error?.data?.message || error?.message || 'Unknown swap error.';
                setError(`Swap failed: ${reason}`);
                setIsLoading(false);
                return null;
            }
        },
        [
            signerAsync,
            accountAddress,
            isConnected,
            routerAddress,
            currentChainId,
            sdkToken0,
            sdkToken1,
            token0?.isNative,
            token1?.isNative,
            checkAndRequestApproval,
        ]
    );

    useEffect(() => {
        setError(null);
    }, [sdkToken0, sdkToken1, pairTokenAddress, direction, currentChainId]);

    return {
        pairTokenAddress,
        direction,
        isLoading: isLoading || isApproving || isFetchingPair,
        isApproving,
        isFetchingPair,
        error,
        setPairTokenAddress,
        setDirection,
        token0,
        token1,
        sdkToken0,
        sdkToken1,
        routerAddress,
        getPair,
        getTradeDetails,
        checkAndRequestApproval,
        executeSwap,
        isReady:
            !!signerAsync &&
            !!accountAddress &&
            isConnected &&
            !!sdkToken0 &&
            !!sdkToken1 &&
            !!routerAddress &&
            !!publicClient &&
            !!currentChainId,
    };
};

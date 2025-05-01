import { ChainId, Token, WETH9, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core';
import { Pair, Route, Trade } from '@uniswap/v2-sdk';
import { useAccount } from 'wagmi';
import { ethers, BrowserProvider, Contract, Signer as EthersSigner } from 'ethers'; // Use ethers v6 imports
import { useWalletClient } from 'wagmi'; // Use WalletClient
import { useEffect, useMemo, useState, useCallback } from 'react';

// ABIs (ensure paths are correct)
import erc20Abi from './abi/erc20.json';
import uniswapV2RouterAbi from './abi/UniswapV2Router02.json';
import uniswapV2PairAbi from './abi/UniswapV2Pair.json';
import { WalletClient } from 'viem';

// --- Constants ---

// Store router addresses per chain ID
// !! VERIFY THESE ADDRESSES !! V2 might not be canonical on all chains listed.
const ROUTER_ADDRESSES: Partial<Record<ChainId, `0x${string}`>> = {
    [ChainId.MAINNET]: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    [ChainId.GOERLI]: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    [ChainId.SEPOLIA]: '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008', // Example Sepolia V2 Router
    [ChainId.POLYGON]: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', // Polygon V2 Router
    // Add other V2 Routers (Arbitrum might primarily use V3)
};

// Example stablecoin (replace or add more as needed)
export const DAI: Partial<Record<ChainId, Token>> = {
    [ChainId.MAINNET]: new Token(
        ChainId.MAINNET,
        '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        18,
        'DAI',
        'Dai Stablecoin'
    ),
    [ChainId.SEPOLIA]: new Token(
        ChainId.SEPOLIA,
        '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
        18,
        'DAI',
        'Dai Stablecoin'
    ), // Example Sepolia DAI
};

// Define your token (XTM) per chain
// const XTM: Partial<Record<ChainId, Token>> = {
//     [ChainId.MAINNET]: new Token(
//         ChainId.MAINNET,
//         '0x0Da6Ed8B13214Ff28e9Ca979Dd37439e8a88F6c4', // Replace with actual Mainnet address
//         18,
//         'XTM',
//         'Your Token Mainnet'
//     ),
//     [ChainId.SEPOLIA]: new Token(
//         ChainId.SEPOLIA,
//         '0xYourSepoliaTokenAddress', // Replace with actual Sepolia address
//         18,
//         'XTM',
//         'Your Token Sepolia'
//     ),
//     // Add other chains where XTM is deployed
// };
//
const XTM = WETH9;

// Helper function to convert WalletClient to ethers Signer (v6)
// Adapt based on your specific wagmi/ethers setup if needed
export async function walletClientToSigner(walletClient: WalletClient): Promise<EthersSigner | null> {
    const { account, chain, transport } = walletClient;
    if (!account || !chain || !transport) return null;
    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    };
    const provider = new BrowserProvider(transport, network);
    const signer = provider.getSigner(account.address); // Potential issue if getSigner is async, might need await provider.getSigner(...)
    return await signer;
}

// --- The Hook ---

export const useSwap = () => {
    // --- State ---
    const [pairTokenAddress, setPairTokenAddress] = useState<`0x${string}` | null>(
        (DAI[ChainId.MAINNET]?.address as `0x${string}`) ?? null
    ); // Store address, derive Token object later
    const [direction, setDirection] = useState<'input' | 'output'>('input');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isApproving, setIsApproving] = useState(false);
    const [isFetchingPair, setIsFetchingPair] = useState(false);

    // --- Wagmi Hooks ---
    const { address, isConnected, chain } = useAccount();
    const { data: walletClient } = useWalletClient(); // Get the WalletClient
    // Optional: Use useEthersSigner if you have @wagmi/ethers-adapter setup
    // const { data: signer } = useEthersSigner({ chainId: chain?.id }); // Preferred if using adapter

    // --- Derived State ---

    // Get the current chain's router address
    const routerAddress = useMemo(() => {
        return chain?.id ? ROUTER_ADDRESSES[chain.id as ChainId] : undefined;
    }, [chain]);

    // Get the specific Token instances for the current chain
    const currentChainId = chain?.id as ChainId | undefined;
    const xtmToken = useMemo(() => (currentChainId ? XTM[currentChainId] : undefined), [currentChainId]);
    const wethToken = useMemo(() => (currentChainId ? WETH9[currentChainId] : undefined), [currentChainId]);

    // Derive the pair token instance from its address state
    const pairToken = useMemo(() => {
        if (!pairTokenAddress || !currentChainId) return wethToken; // Default to WETH if no address or chain
        // Look for the token in your definitions (add more tokens like DAI here)
        if (DAI[currentChainId]?.address.toLowerCase() === pairTokenAddress.toLowerCase()) {
            return DAI[currentChainId];
        }
        if (wethToken?.address.toLowerCase() === pairTokenAddress.toLowerCase()) {
            return wethToken;
        }
        // Add more known tokens...
        console.warn(
            `Token definition not found for address ${pairTokenAddress} on chain ${currentChainId}. Defaulting to WETH.`
        );
        return wethToken; // Fallback or handle unknown token error
    }, [pairTokenAddress, currentChainId, wethToken]);

    // Determine token0 (input) and token1 (output) based on direction
    const { token0, token1 } = useMemo(() => {
        if (!xtmToken || !pairToken || !chain || xtmToken.chainId !== pairToken.chainId) {
            return { token0: null, token1: null };
        }

        const _token0 = direction === 'input' ? pairToken : xtmToken;
        const _token1 = direction === 'input' ? xtmToken : pairToken;

        return { token0: _token0, token1: _token1 };
    }, [pairToken, xtmToken, direction, chain]);

    // Get ethers signer from walletClient (or use useEthersSigner directly)
    const signerAsync = useMemo(async () => {
        if (!walletClient) return null;
        try {
            // You might need to adjust this based on your setup or use useEthersSigner
            const { account, chain, transport } = walletClient;
            const network = { chainId: chain.id, name: chain.name };
            const provider = new BrowserProvider(transport, network);
            return await provider.getSigner(account.address);
        } catch (e) {
            console.error('Error creating ethers signer:', e);
            return null;
        }
    }, [walletClient]);

    // Get provider from signer
    const providerAsync = useMemo(async () => (await signerAsync)?.provider, [signerAsync]);

    // --- SDK Interaction Functions ---

    const getPair = useCallback(async (): Promise<Pair | null> => {
        if (!token0 || !token1 || !providerAsync || token0.chainId !== token1.chainId) {
            console.error('Cannot get pair: Invalid tokens, provider, or mismatched chains.');
            return null;
        }
        setIsFetchingPair(true);
        setError(null);
        try {
            const pairAddress = Pair.getAddress(token0, token1);
            const pairContract = new Contract(pairAddress, uniswapV2PairAbi, await providerAsync);
            // Check if contract code exists (basic check for existence)
            const code = await providerAsync.then((provider) => provider?.getCode(pairAddress));
            if (code === '0x') {
                console.warn(`No contract code found at pair address: ${pairAddress}. Pair likely doesn't exist.`);
                setIsFetchingPair(false);
                return null; // Pair doesn't exist
            }

            const reserves = await pairContract['getReserves']();
            const [reserve0, reserve1] = reserves; // These are BigInts in ethers v6

            const tokens = [token0, token1];
            const [sortedToken0, sortedToken1] = tokens[0].sortsBefore(tokens[1]) ? tokens : [tokens[1], tokens[0]];

            const pair = new Pair(
                CurrencyAmount.fromRawAmount(sortedToken0, reserve0.toString()), // SDK expects string or JSBI
                CurrencyAmount.fromRawAmount(sortedToken1, reserve1.toString())
            );
            setIsFetchingPair(false);
            return pair;
        } catch (error: any) {
            console.error('Error fetching pair:', error);
            // More specific error checking if possible
            if (error.message?.includes('call revert exception') || error.code === 'CALL_EXCEPTION') {
                console.warn(
                    `Pair contract call failed at ${Pair.getAddress(token0, token1)}. It might not exist or have issues.`
                );
            } else {
                setError(`Failed to fetch pair data: ${error.message || 'Unknown error'}`);
            }
            setIsFetchingPair(false);
            return null;
        }
    }, [token0, token1, providerAsync]); // Add provider dependency

    const getTradeDetails = useCallback(
        async (
            inputAmountRaw: string // Expect raw amount string (e.g., '1000000000000000000')
        ): Promise<{ trade: Trade<Token, Token, TradeType.EXACT_INPUT> | null; route: Route<Token, Token> | null }> => {
            if (!token0 || !token1 || !providerAsync) return { trade: null, route: null };

            // Ensure inputAmountRaw is a valid non-negative integer string
            if (!/^\d+$/.test(inputAmountRaw) || BigInt(inputAmountRaw) < 0n) {
                console.error('Invalid raw input amount:', inputAmountRaw);
                setError('Invalid input amount provided.');
                return { trade: null, route: null };
            }

            const pair = await getPair(); // Uses the memoized getPair
            if (!pair) {
                setError('Could not find liquidity pair for these tokens.');
                return { trade: null, route: null };
            }

            try {
                const route = new Route([pair], token0, token1);
                // Use try-catch as Trade constructor can throw if liquidity is insufficient
                const trade = new Trade(
                    route,
                    CurrencyAmount.fromRawAmount(token0, inputAmountRaw),
                    TradeType.EXACT_INPUT
                );
                return { trade, route };
            } catch (e: any) {
                console.error('Error creating trade object:', e);
                // Handle insufficient liquidity specifically if possible (SDK might throw specific errors)
                if (e.message?.includes('LIQUIDITY')) {
                    setError('Insufficient liquidity for this trade.');
                } else {
                    setError(`Error calculating trade: ${e.message || 'Unknown error'}`);
                }
                return { trade: null, route: null };
            }
        },
        [getPair, token0, token1, providerAsync] // Ensure all dependencies are listed
    );

    // --- Transaction Execution Functions ---

    const checkAndRequestApproval = useCallback(
        async (amountToApprove: ethers.BigNumberish): Promise<boolean> => {
            // ethers v6 uses BigNumberish
            if (!signerAsync || !address || !token0 || !routerAddress) {
                setError('Cannot approve: Missing signer, address, token, or router address.');
                return false;
            }
            if (token0.isNative) {
                // No approval needed for native ETH
                return true;
            }

            setIsApproving(true);
            setError(null);
            try {
                const tokenContract = new Contract(token0.address, erc20Abi, await signerAsync);
                const currentAllowance = await tokenContract.allowance(address, routerAddress);

                if (currentAllowance < BigInt(amountToApprove.toString())) {
                    // Compare BigInts
                    console.info(
                        `Allowance is ${currentAllowance.toString()}, need ${amountToApprove.toString()}. Requesting approval...`
                    );
                    const approveTx = await tokenContract.approve(routerAddress, amountToApprove);
                    console.info('Approval transaction sent:', approveTx.hash);
                    const receipt = await approveTx.wait(1); // Wait for 1 confirmation
                    console.info('Approval confirmed:', receipt?.hash);
                    setIsApproving(false);
                    return true;
                } else {
                    console.info(`Sufficient allowance already granted: ${currentAllowance.toString()}`);
                    setIsApproving(false);
                    return true; // Already approved
                }
            } catch (error: any) {
                console.error('Error during approval check/request:', error);
                setError(
                    `Approval failed: ${error?.reason || error?.message || 'User rejected or transaction failed'}`
                );
                setIsApproving(false);
                return false;
            }
        },
        [signerAsync, address, token0, routerAddress] // Use dynamic routerAddress
    );

    const executeSwap = useCallback(
        async (
            inputAmountRaw: string // Raw amount string
        ): Promise<string | null> => {
            setError(null);
            // --- Pre-flight Checks ---
            if (!signerAsync || !address || !isConnected || !token0 || !token1 || !routerAddress || !providerAsync) {
                setError('Swap prerequisites not met (connection, signer, tokens, router).');
                console.error('Swap prerequisites not met:', {
                    signer: !!signerAsync,
                    address,
                    isConnected,
                    token0: !!token0,
                    token1: !!token1,
                    routerAddress,
                    provider: !!providerAsync,
                });
                return null;
            }
            if (token0.chainId !== token1.chainId) {
                setError('Cannot swap between different chains.');
                return null;
            }
            // Validate input amount format
            if (!/^\d+$/.test(inputAmountRaw) || BigInt(inputAmountRaw) <= 0n) {
                setError('Invalid or zero input amount.');
                return null;
            }

            setIsLoading(true);

            try {
                // 1. Calculate Trade Details
                const { trade, route } = await getTradeDetails(inputAmountRaw);
                if (!trade || !route) {
                    // getTradeDetails should have set the error state already
                    console.error('Could not calculate trade route.');
                    setIsLoading(false);
                    return null;
                }

                // 2. Prepare Transaction Parameters
                const slippageTolerance = new Percent('50', '10000'); // 0.5%
                const amountIn = BigInt(inputAmountRaw); // Use BigInt directly
                const amountOutMinString = trade.minimumAmountOut(slippageTolerance).toExact();
                const amountOutMin = ethers.parseUnits(amountOutMinString, token1.decimals); // Still need parseUnits for decimals
                const path = route.path.map((token) => token.address);
                const to = address;
                const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

                console.info('Swap Parameters:', {
                    amountIn: amountIn.toString(),
                    inputSymbol: token0.symbol,
                    amountOutMin: amountOutMin.toString(),
                    outputSymbol: token1.symbol,
                    path: path.join(' -> '),
                    to,
                    deadline: new Date(deadline * 1000).toISOString(),
                });

                // 3. Check and Request Approval (if necessary)
                // No approval needed if input is native currency (ETH)
                if (!token0.isNative) {
                    const approved = await checkAndRequestApproval(amountIn);
                    if (!approved) {
                        // checkAndRequestApproval should have set the error
                        console.error('Token approval failed or was rejected.');
                        setIsLoading(false);
                        return null;
                    }
                    console.info('Token approval sufficient.');
                } else {
                    console.info('Native currency (ETH) input, skipping approval.');
                }

                // 4. Create Router Contract Instance
                const routerContract = new Contract(routerAddress, uniswapV2RouterAbi, await signerAsync);

                // 5. Determine Swap Function and Parameters
                let swapTx;
                const txOptions: { value?: bigint; gasLimit?: bigint } = {}; // Add gasLimit if needed, value for ETH swaps

                // Estimate gas (optional but recommended)
                // try {
                //    const estimatedGas = await routerContract.estimateGas... (call the specific swap function)
                //    txOptions.gasLimit = estimatedGas * BigInt(120) / BigInt(100); // Add 20% buffer
                //} catch (gasError: any) {
                //    console.error("Gas estimation failed:", gasError);
                //    setError(`Gas estimation failed: ${gasError?.reason || gasError?.message}`);
                //    setIsLoading(false);
                //    return null;
                //}

                console.info('Sending swap transaction...');
                // --- Choose correct swap function ---
                if (token0.isNative) {
                    // Swapping ETH for Tokens
                    txOptions.value = amountIn; // Send ETH with the transaction
                    swapTx = await routerContract.swapExactETHForTokens(
                        amountOutMin,
                        path, // path[0] should be WETH address
                        to,
                        deadline,
                        txOptions
                    );
                } else if (token1.isNative) {
                    // Swapping Tokens for ETH
                    swapTx = await routerContract.swapExactTokensForETH(
                        amountIn,
                        amountOutMin,
                        path, // path[path.length - 1] should be WETH address
                        to,
                        deadline,
                        txOptions
                    );
                } else {
                    // Swapping Tokens for Tokens
                    swapTx = await routerContract.swapExactTokensForTokens(
                        amountIn,
                        amountOutMin,
                        path,
                        to,
                        deadline,
                        txOptions
                    );
                }

                console.info('Swap transaction sent:', swapTx.hash);

                // (Optional but recommended) Wait for transaction confirmation
                // console.info("Waiting for swap confirmation...");
                // const receipt = await swapTx.wait(1);
                // console.info("Swap confirmed in block:", receipt.blockNumber);

                setIsLoading(false);
                return swapTx.hash;
            } catch (error: any) {
                console.error('Error executing swap:', error);
                // Extract reason if available (common in reverted transactions)
                const reason = error?.reason || error?.data?.message || error?.message || 'Unknown swap error';
                setError(`Swap failed: ${reason}`);

                // Log more specific common errors
                if (reason.includes('insufficient funds')) {
                    console.error('Check ETH balance for gas.');
                }
                if (reason.includes('user rejected transaction')) {
                    console.error('User rejected the swap.');
                }
                if (reason.includes('EXPIRED')) {
                    console.error('Transaction deadline passed.');
                }
                if (reason.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
                    console.error('Slippage too high or price moved.');
                }
                if (reason.includes('TRANSFER_FAILED') || reason.includes('TRANSFER_FROM_FAILED')) {
                    console.error('Token transfer failed. Check balance/approval.');
                }

                setIsLoading(false);
                return null;
            }
        },
        [
            signerAsync,
            address,
            isConnected,
            token0,
            token1,
            routerAddress,
            providerAsync, // Core dependencies
            getTradeDetails,
            checkAndRequestApproval, // Internal functions
        ]
    );

    // Reset error state when inputs change
    useEffect(() => {
        setError(null);
    }, [token0, token1, pairTokenAddress, direction, chain]);

    // --- Return Hook API ---
    return {
        // State
        pairTokenAddress,
        direction,
        isLoading: isLoading || isApproving || isFetchingPair, // Combine loading states
        isApproving,
        isFetchingPair,
        error,
        // Setters
        setPairTokenAddress, // Allow UI to set the *other* token's address
        setDirection,
        // Derived Data
        token0, // Input token instance
        token1, // Output token instance
        routerAddress, // Current router address
        // Functions
        getPair, // Fetches pair data (useful for displaying liquidity info)
        getTradeDetails, // Calculates trade outcome (useful for previewing swaps)
        checkAndRequestApproval, // Explicitly trigger approval if needed separately
        executeSwap, // The main function to perform the swap
        // Helpers
        isReady:
            !!signerAsync && !!address && isConnected && !!token0 && !!token1 && !!routerAddress && !!providerAsync, // Boolean indicating if basic setup is ready
    };
};

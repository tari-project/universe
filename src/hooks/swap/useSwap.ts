import {
    ChainId,
    Token,
    WETH9, // The wrapped Ether representation for SDK calculations
    CurrencyAmount,
    TradeType,
    Percent,
    Ether, // The native Ether representation for display/API
    NativeCurrency, // Type used by Ether.onChain
} from '@uniswap/sdk-core';
import { Pair, Route, Trade } from '@uniswap/v2-sdk';
import { useAccount } from 'wagmi';
import { ethers, BrowserProvider, Contract, Signer as EthersSigner } from 'ethers'; // Use ethers v6 imports
import { useWalletClient } from 'wagmi'; // Use WalletClient
import { useEffect, useMemo, useState, useCallback } from 'react';
import { WalletClient } from 'viem';

// --- ABIs (Ensure paths are correct) ---
// Make sure these files exist and contain the correct ABI JSON
import erc20Abi from './abi/erc20.json'; // Standard ERC20 ABI
import uniswapV2RouterAbi from './abi/UniswapV2Router02.json'; // Uniswap V2 Router02 ABI
import uniswapV2PairAbi from './abi/UniswapV2Pair.json'; // Uniswap V2 Pair ABI

// --- Constants ---

// Store router addresses per chain ID
// !! VERIFY THESE ADDRESSES !! V2 might not be canonical on all chains listed.
const ROUTER_ADDRESSES: Partial<Record<ChainId, `0x${string}`>> = {
    [ChainId.MAINNET]: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    [ChainId.GOERLI]: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Often same as Mainnet for tests
    [ChainId.SEPOLIA]: '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3', // Uniswap V2 Router address on Sepolia
    [ChainId.POLYGON]: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', // SushiSwap Router (commonly used as V2 Router on Polygon)
    // Add other V2 Routers (Arbitrum might primarily use V3, check Uniswap docs)
};

// Add Public RPC URLs for read-only operations (replace with your preferred ones)
const PUBLIC_RPC_URLS: Partial<Record<ChainId, string>> = {
    [ChainId.MAINNET]: 'https://rpc.ankr.com/eth', // Example for Mainnet via Ankr
    [ChainId.SEPOLIA]: 'https://gateway.tenderly.co/public/sepolia', // Official public Sepolia RPC
    // Or from https://chainlist.org/ (filter for desired network)
};

// --- Token Definitions ---

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
        '0x68194a729C2450ad26072b3D33ADaCbcef39D574',
        18,
        'DAI',
        'Dai Stablecoin'
    ),
};

export const USDC: Partial<Record<ChainId, Token>> = {
    [ChainId.MAINNET]: new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin'),
    [ChainId.SEPOLIA]: new Token(ChainId.SEPOLIA, '0x73d219B3881E481394DA6B5008A081d623992200', 6, 'USDC', 'USD Coin'),
};

// Define your token (XTM) per chain - USING DAI AS A PLACEHOLDER
// Replace this with your actual XTM token details and addresses
export const XTM: Partial<Record<ChainId, Token>> = {
    [ChainId.MAINNET]: DAI[ChainId.MAINNET]!, // Replace with actual XTM Token object
    [ChainId.SEPOLIA]: DAI[ChainId.SEPOLIA]!, // Replace with actual XTM Token object
    // Add other chains where XTM is deployed
};

// Known tokens map for easy lookup by address (case-insensitive)
// Populate this with tokens your app commonly uses
const KNOWN_TOKENS: Partial<Record<ChainId, Record<`0x${string}`, Token>>> = {};

// Function to populate KNOWN_TOKENS (call this once or ensure it runs)
function initializeKnownTokens() {
    for (const chainIdStr in ChainId) {
        const chainId = Number(chainIdStr) as ChainId;
        if (isNaN(chainId)) continue; // Skip string keys like 'MAINNET'

        KNOWN_TOKENS[chainId] = {}; // Initialize chain record

        // Add WETH
        const weth = WETH9[chainId];
        if (weth) {
            KNOWN_TOKENS[chainId]!['0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9' as `0x${string}`] = weth;
        }

        // Add DAI if defined
        const dai = DAI[chainId];
        if (dai) {
            KNOWN_TOKENS[chainId]![dai.address.toLowerCase() as `0x${string}`] = dai;
        }

        // Add XTM if defined (and different from DAI)
        const xtm = XTM[chainId];
        if (xtm && (!dai || !xtm.equals(dai))) {
            // Avoid adding duplicates if XTM === DAI
            KNOWN_TOKENS[chainId]![xtm.address.toLowerCase() as `0x${string}`] = xtm;
        }

        // Add other tokens here...
        // e.g., USDC[chainId], USDT[chainId], etc.
    }
}
initializeKnownTokens(); // Call initialization
// If Dev mode, use sepolia if prod, use mainnet
const defaultChainId = process.env.NODE_ENV === 'development' ? ChainId.SEPOLIA : ChainId.MAINNET;

// --- Helper Function ---

// Convert wagmi WalletClient (viem) to ethers Signer (v6)
// Note: Ensure BrowserProvider handles the transport correctly.
export async function walletClientToSigner(walletClient: WalletClient): Promise<EthersSigner | null> {
    const { account, chain, transport } = walletClient;
    if (!account || !chain || !transport) {
        console.error('WalletClient missing account, chain, or transport');
        return null;
    }
    try {
        const network = {
            chainId: chain.id,
            name: chain.name,
            ensAddress: chain.contracts?.ensRegistry?.address,
        };
        // Use BrowserProvider for browser-based wallets (like MetaMask)
        const provider = new BrowserProvider(transport, network);
        const signer = await provider.getSigner(account.address);
        return signer;
    } catch (e) {
        console.error('Error creating ethers signer from WalletClient:', e);
        return null;
    }
}

// --- The Swap Hook ---

export const useSwap = () => {
    // --- State ---
    // Default pair token to native ETH (represented by null address)
    const [pairTokenAddress, setPairTokenAddress] = useState<`0x${string}` | null>(null);
    const [direction, setDirection] = useState<'input' | 'output'>('input'); // 'input': PairToken -> XTM, 'output': XTM -> PairToken
    const [isLoading, setIsLoading] = useState(false); // General loading state for swap execution
    const [error, setError] = useState<string | null>(null);
    const [isApproving, setIsApproving] = useState(false); // Specific loading state for approval
    const [isFetchingPair, setIsFetchingPair] = useState(false); // Specific loading state for fetching pair data

    // --- Wagmi Hooks ---
    const { address, isConnected, chain } = useAccount();
    const { data: walletClient } = useWalletClient(); // Get the WalletClient

    // --- Derived State ---

    // Get the current chain's ID and router address
    const currentChainId = useMemo(() => chain?.id || defaultChainId, [chain]);
    const routerAddress = useMemo(() => {
        return currentChainId ? ROUTER_ADDRESSES[currentChainId] : undefined;
    }, [currentChainId]);

    // Get the primary token instance (e.g., XTM) for the current chain
    const xtmToken = useMemo(() => (currentChainId ? XTM[currentChainId] : undefined), [currentChainId]);

    const publicRpcProvider = useMemo(() => {
        if (!currentChainId || !PUBLIC_RPC_URLS[currentChainId]) {
            console.warn(`No public RPC URL configured for chainId: ${currentChainId}`);
            return null;
        }
        try {
            // Use JsonRpcProvider for ethers v6
            return new ethers.JsonRpcProvider(PUBLIC_RPC_URLS[currentChainId], currentChainId);
        } catch (e) {
            console.error('Error creating public JsonRpcProvider:', e);
            return null;
        }
    }, [currentChainId]);

    // Get ethers Signer and Provider asynchronously
    const signerAsync = useMemo(async () => {
        if (!walletClient) return null;
        return walletClientToSigner(walletClient);
    }, [walletClient]);

    const providerAsync = useMemo(async () => {
        if (walletClient) {
            // If wallet is connected
            const signer = await signerAsync; // This will re-use the signerAsync memo
            if (signer?.provider) {
                return signer.provider;
            }
            // Fallback if signer or its provider couldn't be obtained from walletClient
            // (though walletClientToSigner should handle provider creation)
        }
        return publicRpcProvider;
    }, [publicRpcProvider, signerAsync, walletClient]);

    // Derive the pair token instance (SDK object: WETH9 for native, Token otherwise)
    // This token is used for INTERNAL SDK calculations (Pair, Route, Trade)
    const sdkPairToken = useMemo(() => {
        const chainId = currentChainId;
        if (!chainId) return undefined;

        const currentWeth = WETH9[chainId]; // WETH9 object for the current chain

        // If state address is null (our signal for native ETH)
        if (pairTokenAddress === null) {
            return currentWeth; // Use the WETH9 object
        }

        // If address is set, try to find it (case-insensitive)
        const lowerCaseAddress = pairTokenAddress.toLowerCase() as `0x${string}`;
        const knownToken = KNOWN_TOKENS[chainId]?.[lowerCaseAddress];

        if (knownToken) {
            return knownToken; // Return WETH9 or other known token
        } else {
            console.warn(
                `Token definition not found for address ${pairTokenAddress} on chain ${chainId}. Cannot form pair.`
            );
            // Optional: Implement dynamic fetching of token data here if needed
            setError(`Unknown token address: ${pairTokenAddress}`);
            return undefined; // Token not known, cannot proceed
        }
    }, [pairTokenAddress, currentChainId]);

    // Determine internal SDK tokens based on direction (always use Token/WETH9)
    const { sdkToken0, sdkToken1 } = useMemo(() => {
        // sdkPairToken will be WETH9 if native ETH is selected
        const _sdkToken0 = direction === 'input' ? sdkPairToken : xtmToken;
        const _sdkToken1 = direction === 'input' ? xtmToken : sdkPairToken;

        return { sdkToken0: _sdkToken0, sdkToken1: _sdkToken1 };
    }, [sdkPairToken, xtmToken, direction]);

    // Derive Output Tokens for API/UI (using NativeCurrency for ETH)
    // This provides a clearer representation (e.g., 'ETH' symbol, isNative=true) to the hook consumer/UI
    const { token0, token1 } = useMemo(() => {
        const mapToNative = (token: Token | undefined): Token | NativeCurrency | undefined => {
            if (!token || !currentChainId) return undefined;
            const currentWeth = WETH9[currentChainId];
            // Check if the SDK token IS the WETH9 wrapper for the current chain's native currency
            if (currentWeth && token.equals(currentWeth)) {
                // Return the Ether object from sdk-core for native representation
                return Ether.onChain(currentChainId);
            }
            return token; // Otherwise return the original ERC20 Token object
        };

        return {
            token0: mapToNative(sdkToken0), // Input token for UI
            token1: mapToNative(sdkToken1), // Output token for UI
        };
    }, [sdkToken0, sdkToken1, currentChainId]);

    // --- SDK Interaction Functions ---

    // Fetches Pair data using SDK Tokens (WETH9 for native)
    const getPair = useCallback(
        async (preview?: boolean): Promise<Pair | null> => {
            // Use sdkToken0 and sdkToken1 which contain WETH9 if native is involved
            if (!preview && (!sdkToken0 || !sdkToken1 || !providerAsync || sdkToken0.chainId !== sdkToken1.chainId)) {
                console.error('Cannot get pair: Invalid SDK tokens, provider, or mismatched chains.');
                setError('Invalid token setup or provider.');
                return null;
            }

            setIsFetchingPair(true);
            setError(null);
            try {
                const pairAddress = Pair.getAddress(sdkToken0, sdkToken1);
                const provider = await providerAsync;
                if (!provider && !preview) throw new Error('Provider not available');

                const pairContract = new Contract(pairAddress, uniswapV2PairAbi, provider); // Use provider for reads

                // Basic check if pair contract exists
                const code = preview ? '0x' : await provider?.getCode(pairAddress);
                if (!preview && (code === '0x' || code === '')) {
                    console.warn(`No contract code found at pair address: ${pairAddress}. Pair likely doesn't exist.`);
                    setError('Liquidity pair not found.');
                    setIsFetchingPair(false);
                    return null; // Pair doesn't exist
                }

                const reserves = await pairContract['getReserves']();
                const [reserve0, reserve1] = reserves; // These are BigInts in ethers v6

                // Ensure reserves are not zero, otherwise Pair constructor might fail
                if (reserve0 === 0n && reserve1 === 0n) {
                    console.warn(`Pair ${pairAddress} has zero reserves.`);
                    setError('Liquidity pair has no liquidity.');
                    setIsFetchingPair(false);
                    return null;
                }

                const tokens = [sdkToken0, sdkToken1]; // Use SDK tokens

                // Create Pair object using CurrencyAmount with raw amounts (strings)
                const pair = new Pair(
                    CurrencyAmount.fromRawAmount(tokens[0], reserve0.toString()),
                    CurrencyAmount.fromRawAmount(tokens[1], reserve1.toString())
                );
                setIsFetchingPair(false);
                return pair;
            } catch (error: any) {
                console.error('Error fetching pair:', error);
                if (error.message?.includes('call revert exception') || error.code === 'CALL_EXCEPTION') {
                    console.warn(
                        `Pair contract call failed at ${Pair.getAddress(sdkToken0, sdkToken1)}. It might not exist or have issues.`
                    );
                    setError('Could not fetch pair data (pair might not exist).');
                } else {
                    setError(`Failed to fetch pair data: ${error.message || 'Unknown error'}`);
                }
                setIsFetchingPair(false);
                return null;
            }
        },
        [sdkToken0, sdkToken1, providerAsync]
    ); // Use SDK tokens in dependency array

    // Calculates trade details using SDK Tokens (WETH9 for native)
    const getTradeDetails = useCallback(
        async (
            inputAmountRaw: string // Expect raw amount string (e.g., '1000000000000000000' for 1 ETH/Token)
        ): Promise<{ trade: Trade<Token, Token, TradeType.EXACT_INPUT> | null; route: Route<Token, Token> | null }> => {
            // Validate input amount format (non-negative integer string)
            if (!/^\d+$/.test(inputAmountRaw) || BigInt(inputAmountRaw) <= 0n) {
                console.error('Invalid raw input amount:', inputAmountRaw);
                setError('Invalid or zero input amount provided.');
                return { trade: null, route: null };
            }

            const pair = await getPair(true); // Uses the memoized getPair with SDK tokens
            if (!pair) {
                // getPair should have set an error if it failed significantly
                if (!error) setError('Could not find liquidity pair for trade.');
                return { trade: null, route: null };
            }

            try {
                // Route and Trade require Token objects (WETH9 for native)
                const route = new Route([pair], sdkToken0 || WETH9[currentChainId], sdkToken1 || WETH9[currentChainId]);
                const trade = new Trade(
                    route,
                    CurrencyAmount.fromRawAmount(sdkToken0, inputAmountRaw), // Use the input SDK token
                    TradeType.EXACT_INPUT
                );
                setError(null); // Clear previous errors on success
                return { trade, route };
            } catch (e: any) {
                console.error('Error creating trade object:', e);
                // Handle insufficient liquidity specifically if possible
                if (e.message?.includes('LIQUIDITY') || e.message?.includes('ZERO_RESERVES')) {
                    setError('Insufficient liquidity for this trade.');
                } else if (e.message?.includes('INVALID_INPUT')) {
                    setError('Invalid input amount for trade calculation.');
                } else {
                    setError(`Error calculating trade: ${e.message || 'Unknown error'}`);
                }
                return { trade: null, route: null };
            }
        },
        [getPair, error, sdkToken0, currentChainId, sdkToken1] // Include error to potentially clear it
    );

    // --- Transaction Execution Functions ---

    // Checks allowance and requests approval if needed. Uses SDK input token (sdkToken0).
    const checkAndRequestApproval = useCallback(
        async (amountToApprove: ethers.BigNumberish): Promise<boolean> => {
            // Use sdkToken0 for checking approval requirements
            if (!signerAsync || !address || !sdkToken0 || !routerAddress || !currentChainId) {
                setError('Cannot approve: Missing signer, address, token, router, or chain info.');
                return false;
            }

            // *** Check if the INPUT token is native ETH (represented by WETH9) ***
            // const isNativeInput = sdkToken0.equals(WETH9[currentChainId]);

            // if (isNativeInput) {
            //     // No approval needed for native ETH input
            //     console.info('Approval not needed for native ETH input.');
            //     return true;
            // }

            // Proceed with ERC20 approval logic
            setIsApproving(true);
            setError(null);
            const signer = await signerAsync;
            if (!signer) {
                setError('Signer not available for approval.');
                setIsApproving(false);
                return false;
            }

            try {
                const tokenContract = new Contract(sdkToken0.address, erc20Abi, signer);
                const amountToApproveBI = BigInt(amountToApprove.toString()); // Convert to BigInt for comparison

                // Check current allowance
                const currentAllowance = await tokenContract.allowance(address, routerAddress);

                if (currentAllowance < amountToApproveBI) {
                    console.info(
                        `Allowance (${currentAllowance.toString()}) is less than required (${amountToApproveBI.toString()}). Requesting approval for ${sdkToken0.symbol}...`
                    );
                    // Request maximum approval for simplicity, or amountToApproveBI
                    const approveAmount = amountToApproveBI;
                    const approveTx = await tokenContract.approve(routerAddress, approveAmount);
                    console.info('Approval transaction sent:', approveTx.hash);
                    // Wait for 1 confirmation
                    const receipt = await approveTx.wait(1);
                    console.info('Approval confirmed:', receipt?.hash);
                    if (receipt?.status !== 1) {
                        throw new Error('Approval transaction failed.');
                    }
                    // Re-verify allowance after confirmation (optional but good practice)
                    const newAllowance = await tokenContract.allowance(address, routerAddress);
                    if (newAllowance < amountToApproveBI && approveAmount !== ethers.MaxUint256) {
                        // This shouldn't happen if approval succeeded, but check anyway if not approving max
                        console.error(
                            `Approval confirmed but allowance (${newAllowance}) is still less than required (${amountToApproveBI}).`
                        );
                        throw new Error('Allowance update discrepancy after confirmation.');
                    }
                    console.info(`Approval successful. New allowance: ${newAllowance.toString()}`);
                    setIsApproving(false);
                    return true;
                } else {
                    console.info(
                        `Sufficient allowance already granted for ${sdkToken0.symbol}: ${currentAllowance.toString()}`
                    );
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
        [signerAsync, address, sdkToken0, routerAddress, currentChainId] // Use sdkToken0
    );

    // Executes the swap transaction. Uses SDK tokens (WETH9 for native).
    const executeSwap = useCallback(
        async (
            inputAmountRaw: string // Raw amount string for the input token
        ): Promise<string | null> => {
            // Returns transaction hash on success, null on failure
            setError(null);
            setIsLoading(true);

            // --- Pre-flight Checks ---
            // Use sdkToken0 and sdkToken1 for checks
            if (
                !signerAsync ||
                !address ||
                !isConnected ||
                !sdkToken0 ||
                !sdkToken1 ||
                !routerAddress ||
                !providerAsync ||
                !currentChainId
            ) {
                setError('Swap prerequisites not met (connection, signer, tokens, router, etc.).');
                console.error('Swap prerequisites failed:', {
                    hasSigner: !!signerAsync,
                    address,
                    isConnected,
                    hasSdkToken0: !!sdkToken0,
                    hasSdkToken1: !!sdkToken1,
                    routerAddress,
                    hasProvider: !!providerAsync,
                    currentChainId,
                });
                setIsLoading(false);
                return null;
            }
            if (sdkToken0.chainId !== sdkToken1.chainId) {
                setError('Cannot swap between different chains.');
                setIsLoading(false);
                return null;
            }
            // Basic validation on raw amount string
            let amountIn: bigint;
            try {
                amountIn = BigInt(inputAmountRaw);
                if (amountIn <= 0n) throw new Error('Amount must be positive.');
            } catch (e) {
                setError('Invalid input amount format or value.');
                setIsLoading(false);
                return null;
            }

            try {
                // 1. Calculate Trade Details (uses getTradeDetails with sdkTokens)
                const { trade, route } = await getTradeDetails(inputAmountRaw);
                if (!trade || !route) {
                    // getTradeDetails should have set the error state already
                    console.error('Could not calculate trade details.');
                    // If no error set yet, set a generic one
                    if (!error) setError('Failed to calculate trade details.');
                    setIsLoading(false);
                    return null;
                }

                // 2. Prepare Transaction Parameters
                const slippageTolerance = new Percent('50', '10000'); // 0.5% (adjust as needed)
                // Use sdkToken1 (which might be WETH9) for minimumAmountOut calculation
                const amountOutMinRaw = trade.minimumAmountOut(slippageTolerance).toExact(); // Get exact string representation
                // Use decimals from sdkToken1 (WETH9 has 18) to convert to BigInt
                const amountOutMin = ethers.parseUnits(amountOutMinRaw, sdkToken1.decimals);

                // Path uses addresses from SDK tokens (WETH9 address for native)
                const path = route.path.map((token) => token.address as `0x${string}`); // Ensure addresses are `0x...` strings
                const to = address; // Send the output token/ETH to the connected wallet
                const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

                console.info('Swap Execution Details:', {
                    amountIn: amountIn.toString(),
                    inputSymbol: sdkToken0.symbol,
                    inputDecimals: sdkToken0.decimals,
                    amountOutMin: amountOutMin.toString(),
                    outputSymbol: sdkToken1.symbol,
                    outputDecimals: sdkToken1.decimals,
                    path: path.join(' -> '),
                    recipient: to,
                    deadline: new Date(deadline * 1000).toISOString(),
                    slippageTolerance: slippageTolerance.toSignificant(4) + '%',
                });

                // // *** Check if input/output tokens are native ETH (using WETH9 object) ***
                // const isInputNative = sdkToken0.equals(WETH9[currentChainId]);
                // const isOutputNative = sdkToken1.equals(WETH9[currentChainId]);

                // 3. Check and Request Approval (if input is not native ETH)
                //if (!isInputNative) {
                console.info(`Checking approval for ${sdkToken0.symbol}...`);
                // Pass amountIn (BigInt) to approval function
                const approved = await checkAndRequestApproval(amountIn); // Uses sdkToken0 inside
                if (!approved) {
                    // checkAndRequestApproval should have set the error
                    console.error('Token approval failed or was rejected.');
                    setIsLoading(false);
                    return null; // Stop execution if approval fails
                }
                console.info(`${sdkToken0.symbol} approval sufficient.`);
                // } else {
                //     console.info('Native ETH input, skipping approval step.');
                // }

                // 4. Get Signer and Create Router Contract Instance
                const signer = await signerAsync;
                if (!signer) {
                    setError('Signer became unavailable before sending transaction.');
                    setIsLoading(false);
                    return null;
                }
                const routerContract = new Contract(routerAddress, uniswapV2RouterAbi, signer);

                // 5. Determine Swap Function and Execute Transaction
                const txOptions: { value?: bigint; gasLimit?: bigint } = {}; // For sending ETH or setting gas limit

                // --- Optional: Gas Estimation (can be complex and sometimes unreliable) ---
                try {
                    const methodArgs = [amountIn, amountOutMin, path, to, deadline];

                    const methodName = direction === 'output' ? 'swapExactTokensForTokens' : 'swapTokensForExactTokens';

                    // Estimate gas using the contract instance connected to the signer
                    const estimatedGasLimit = await routerContract[methodName].estimateGas(...methodArgs, {});
                    // Add a buffer (e.g., 20%)
                    txOptions.gasLimit = (estimatedGasLimit * 120n) / 100n;
                    console.info(
                        `Estimated gas limit: ${estimatedGasLimit.toString()}, using: ${txOptions.gasLimit.toString()}`
                    );
                } catch (gasError: any) {
                    console.warn('Gas estimation failed:', gasError?.reason || gasError?.message);
                    // Don't fail the swap, let the wallet estimate, but log the warning
                    // setError(`Gas estimation failed: ${gasError?.reason || gasError?.message}`);
                    // setIsLoading(false);
                    // return null;
                }
                // --- End Optional Gas Estimation ---

                console.info(`Attempting swap: ${sdkToken0.symbol} -> ${sdkToken1.symbol}...`);
                // --- Choose correct swap function based on native checks ---
                // if (isInputNative) {
                //     // Swapping ETH for Tokens
                //     console.info(`Calling swapExactETHForTokens with value ${ethers.formatEther(amountIn)} ETH`);
                //     txOptions.value = amountIn; // Send ETH with the transaction
                //     swapTxResponse = await routerContract.swapExactETHForTokens(
                //         amountOutMin, // min amount of token1 to receive
                //         path, // path[0] MUST be WETH address
                //         to, // recipient address
                //         deadline
                //         // txOptions // contains value (ETH amount) and optional gasLimit
                //     );
                // } else if (isOutputNative) {
                //     // Swapping Tokens for ETH
                //     console.info(
                //         `Calling swapExactTokensForETH for ${ethers.formatUnits(amountIn, sdkToken0.decimals)} ${sdkToken0.symbol}`
                //     );
                //     // Router automatically unwraps WETH to ETH and sends to 'to' address
                //     swapTxResponse = await routerContract.swapExactTokensForETH(
                //         amountIn, // amount of token0 (ERC20) to send
                //         amountOutMin, // min amount of ETH (calculated as WETH) to receive
                //         path, // path[path.length - 1] MUST be WETH address
                //         to, // recipient address
                //         deadline
                //         //txOptions // Should NOT contain 'value', may contain gasLimit
                //     );
                // } else {
                // Swapping Tokens for Tokens
                console.info(
                    `Calling swapExactTokensForTokens for ${ethers.formatUnits(amountIn, sdkToken0.decimals)} ${sdkToken0.symbol}`
                );
                const swapTxResponse = await routerContract.swapExactTokensForTokens(
                    amountIn, // amount of token0 to send
                    amountOutMin, // min amount of token1 to receive
                    path,
                    to,
                    deadline,
                    txOptions // Should NOT contain 'value', may contain gasLimit
                );
                //}

                console.info('Swap transaction sent successfully! Hash:', swapTxResponse.hash);
                setIsLoading(false);

                // Optional: Wait for confirmation (provides better UX feedback)
                // console.info("Waiting for transaction confirmation (1 block)...");
                // const receipt = await swapTxResponse.wait(1); // Wait for 1 confirmation
                // console.info("Swap confirmed in block:", receipt?.blockNumber);
                // if (receipt?.status === 0) {
                //     console.error("Swap transaction failed (reverted) on-chain.");
                //     setError("Swap transaction failed on-chain.");
                //     return null; // Indicate failure after confirmation
                // }
                // console.info("Swap transaction successfully confirmed!");

                return swapTxResponse.hash; // Return the transaction hash
            } catch (error: any) {
                console.error('Error executing swap transaction:', error);
                // Try to extract a meaningful error reason
                const reason =
                    error?.reason || // Ethers v6 specific reason
                    error?.data?.message || // Nested error data
                    error?.message || // General message
                    'Unknown swap error occurred.';

                // Provide more specific feedback based on common errors
                let userFriendlyError = `Swap failed: ${reason}`;
                if (reason.includes('insufficient funds')) {
                    userFriendlyError = 'Swap failed: Insufficient funds for gas fees.';
                } else if (reason.includes('user rejected transaction') || error.code === 'ACTION_REJECTED') {
                    userFriendlyError = 'Swap failed: Transaction rejected by user.';
                } else if (reason.includes('deadline expired') || reason.includes('Transaction too old')) {
                    userFriendlyError = 'Swap failed: Transaction deadline expired. Please try again.';
                } else if (reason.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
                    userFriendlyError =
                        'Swap failed: Slippage too high or price changed significantly. Try increasing slippage tolerance or swapping a smaller amount.';
                } else if (reason.includes('TRANSFER_FAILED') || reason.includes('TRANSFER_FROM_FAILED')) {
                    userFriendlyError = `Swap failed: Token transfer failed. Check ${sdkToken0?.symbol} balance and allowance.`;
                } else if (reason.includes('UniswapV2Router: EXCESSIVE_INPUT_AMOUNT')) {
                    // Only for swapTokensForExact... or swapETHForExact...
                    userFriendlyError = `Swap failed: Provided too much input for the desired output.`; // Less common for exact input swaps
                } else if (reason.includes('UniswapV2Router: INSUFFICIENT_LIQUIDITY')) {
                    userFriendlyError = `Swap failed: Insufficient liquidity in the pair.`;
                } else if (reason.includes('call revert exception') && error.transaction) {
                    // Potential revert without specific reason string
                    userFriendlyError = `Swap transaction reverted. Check transaction on explorer: ${error.transaction?.hash}`;
                }

                setError(userFriendlyError);
                setIsLoading(false);
                return null; // Indicate swap failure
            }
        },
        [
            signerAsync,
            address,
            isConnected,
            sdkToken0,
            sdkToken1,
            routerAddress,
            providerAsync,
            currentChainId,
            getTradeDetails,
            checkAndRequestApproval,
            error,
            direction,
        ]
    );

    // Effect to reset error state when relevant inputs change
    useEffect(() => {
        setError(null);
    }, [sdkToken0, sdkToken1, pairTokenAddress, direction, currentChainId]); // Depend on chainId as well

    // --- Return Hook API ---
    return {
        // --- State ---
        pairTokenAddress, // The address selected in the UI (null for native ETH)
        direction, // Swap direction ('input' or 'output')
        isLoading: isLoading || isApproving || isFetchingPair, // Combined loading state
        isApproving, // Specific approval loading state
        isFetchingPair, // Specific pair fetching state
        error, // Current error message string or null

        // --- Setters ---
        setPairTokenAddress, // Function to update the pair token address (pass null for ETH)
        setDirection, // Function to set swap direction

        // --- Derived Data (for UI display) ---
        // These use NativeCurrency (Ether) for native ETH, Token otherwise
        token0, // Input token (NativeCurrency or Token)
        token1, // Output token (NativeCurrency or Token)

        // --- Internal SDK Tokens (can be exposed if needed for advanced UI/debugging) ---
        // sdkToken0, // Input token (WETH9 or Token)
        // sdkToken1, // Output token (WETH9 or Token)

        // --- Configuration ---
        routerAddress, // Current router address being used

        // --- Core Functions ---
        getPair, // Function to fetch and return Pair data
        getTradeDetails, // Function to calculate trade outcome (preview)
        checkAndRequestApproval, // Function to explicitly trigger approval if needed
        executeSwap, // Function to perform the actual swap transaction

        // --- Readiness Check ---
        // Indicates if the hook has the basic requirements to attempt a swap
        isReady:
            !!signerAsync &&
            !!address &&
            isConnected &&
            !!sdkToken0 &&
            !!sdkToken1 &&
            !!routerAddress &&
            !!providerAsync &&
            !!currentChainId,
    };
};

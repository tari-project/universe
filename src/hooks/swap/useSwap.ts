import { ChainId, Token, WETH9, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core';
import { useAccount, useSignMessage } from 'wagmi'; // Import useSigner
import { Pair, Route, Trade } from '@uniswap/v2-sdk';
import { ethers } from 'ethers';
// ABI for the ERC20 token standard (needed for approve)
import erc20Abi from './abi/erc20.json'; // Make sure you have a standard ERC20 ABI file
// ABI for the Uniswap V2 Router
import uniswapV2RouterAbi from './abi/UniswapV2Router02.json'; // Get this ABI!
// Your Pair ABI (keep it if you still need getReserves directly)
import uniswapV2PairAbi from './abi/UniswapV2Pair.json';
import { useMemo, useState, useCallback } from 'react'; // Import useCallback

// --- Constants ---
// !! Replace with your target chain's Router address !!
const UNISWAP_V2_ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'; // Example: Mainnet/Goerli

// !! Define Tokens for your TARGET CHAIN !!
// Make sure ChainId matches your target network connector provides
const TARGET_CHAIN_ID = ChainId.MAINNET; // Or ChainId.GOERLI, etc.

// Example Tokens (replace with addresses ON YOUR TARGET CHAIN)
const DAI = new Token(TARGET_CHAIN_ID, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'Dai Stablecoin');
const WETH = WETH9[TARGET_CHAIN_ID];

// --- Constants ---
// Store router addresses per chain ID for flexibility
const ROUTER_ADDRESSES: Partial<Record<ChainId, `0x${string}`>> = {
    [ChainId.MAINNET]: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    [ChainId.GOERLI]: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    // Add addresses for other networks supported by reown/your app
    [ChainId.POLYGON]: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', // Example Polygon Router
    [ChainId.ARBITRUM_ONE]: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Note: This is V3 Router for Arbitrum, V2 might differ or not exist canonically
    // Find and add addresses for Base, Scroll testnets/mainnets if using V2
};

const XTM: Partial<Record<ChainId, Token>> = {
    [ChainId.MAINNET]: new Token(
        ChainId.MAINNET,
        '0x0Da6Ed8B13214Ff28e9Ca979Dd37439e8a88F6c4',
        18,
        'XTM',
        'Your Token Mainnet'
    ),
    [ChainId.GOERLI]: undefined, // Add Goerli address if exists
    [ChainId.POLYGON]: undefined, // Add Polygon address if exists
    // ... add for other chains
};

export const useSwap = () => {
    const [pairTokens, setPairTokens] = useState<Token | null>(DAI);
    const [direction, setDirection] = useState<'input' | 'output'>('input');
    const { connector, address, isConnected, chain } = useAccount();
    const { signMessageAsync: signer } = useSignMessage();

    const { token0, token1 } = useMemo(() => {
        if (!pairTokens || !direction || !chain) return { token0: null, token1: null };

        const xtmCoin = XTM[chain.id];
        const targetCoin = pairTokens || WETH[chain.id];
        if (!xtmCoin || !targetCoin) return { token0: null, token1: null };

        const token0 = direction === 'input' ? pairTokens || WETH[chain?.id] : XTM[chain?.id];
        const token1 = direction === 'input' ? XTM[chain?.id] : pairTokens || WETH[chain?.id];

        return {
            token0,
            token1,
        };
    }, [pairTokens, direction, chain]);

    // --- SDK Calculation Functions (Mostly unchanged) ---

    const getPair = useCallback(
        async (currentProvider: any): Promise<Pair | null> => {
            // Make sure tokens are on the same chain
            if (token0.chainId !== token1.chainId) {
                console.error('Tokens are on different chains');
                return null;
            }
            try {
                const pairAddress = Pair.getAddress(token0, token1);
                const pairContract = new ethers.Contract(pairAddress, uniswapV2PairAbi, currentProvider);
                const reserves = await pairContract['getReserves']();
                const [reserve0, reserve1] = reserves;

                const tokens = [token0, token1];
                const [sortedToken0, sortedToken1] = tokens[0].sortsBefore(tokens[1]) ? tokens : [tokens[1], tokens[0]];

                const pair = new Pair(
                    CurrencyAmount.fromRawAmount(sortedToken0, reserve0.toString()), // Use toString for BigNumber safety
                    CurrencyAmount.fromRawAmount(sortedToken1, reserve1.toString())
                );
                return pair;
            } catch (error) {
                console.error('Error fetching pair:', error);
                // Handle cases where the pair might not exist yet
                if (
                    error instanceof Error &&
                    (error.message.includes('invalid address') || error.message.includes('call revert exception'))
                ) {
                    console.warn(`Pair contract likely doesn't exist at ${Pair.getAddress(token0, token1)}`);
                }
                return null;
            }
        },
        [token0, token1]
    ); // Add dependencies

    const getTradeDetails = useCallback(
        async (
            inputAmountRaw: string, // Expect raw amount (e.g., '1000000000000000000' for 1 Ether)
            currentProvider: any
        ): Promise<{ trade: Trade<Token, Token, TradeType.EXACT_INPUT> | null; route: Route<Token, Token> | null }> => {
            const pair = await getPair(currentProvider);
            if (!pair) return { trade: null, route: null };

            const route = new Route([pair], token0, token1);
            const trade = new Trade(route, CurrencyAmount.fromRawAmount(token0, inputAmountRaw), TradeType.EXACT_INPUT);

            return { trade, route };
        },
        [getPair, token0, token1]
    ); // Add dependencies

    // --- Transaction Execution Functions ---

    const checkAndRequestApproval = useCallback(
        async (amountToApprove: any): Promise<boolean> => {
            if (!signer || !address || !token0) return false;

            try {
                const tokenContract = new ethers.Contract(token0.address, erc20Abi, signer);
                const currentAllowance = await tokenContract.allowance(address, UNISWAP_V2_ROUTER_ADDRESS);

                if (currentAllowance.lt(amountToApprove)) {
                    console.log(
                        `Allowance is ${currentAllowance.toString()}, need ${amountToApprove.toString()}. Requesting approval...`
                    );
                    // Request approval
                    const approveTx = await tokenContract.approve(UNISWAP_V2_ROUTER_ADDRESS, amountToApprove); // Or ethers.constants.MaxUint256 for max approval
                    console.log('Approval transaction sent:', approveTx.hash);
                    await approveTx.wait(1); // Wait for 1 confirmation
                    console.log('Approval confirmed.');
                    return true; // Approval granted or already sufficient
                } else {
                    console.log(`Sufficient allowance already granted: ${currentAllowance.toString()}`);
                    return true; // Already approved
                }
            } catch (error) {
                console.error('Error during approval check/request:', error);
                // Handle user rejection, etc.
                return false;
            }
        },
        [signer, address, token0]
    ); // Add dependencies

    const executeSwap = useCallback(
        async (
            inputAmountRaw: string // Raw amount string
        ): Promise<string | null> => {
            // Returns transaction hash or null on failure
            if (!signer || !address || !isConnected || !token0 || !token1) {
                console.error('Swap prerequisites not met (signer, address, connection, tokens)');
                return null;
            }
            if (token0.chainId !== token1.chainId) {
                console.error('Cannot swap between different chains');
                return null;
            }

            const provider = await connector?.getProvider();
            if (!provider) {
                console.error('Provider not found');
                return null;
            }

            try {
                // 1. Calculate Trade Details
                const { trade, route } = await getTradeDetails(inputAmountRaw, provider);
                if (!trade || !route) {
                    console.error('Could not calculate trade route.');
                    return null;
                }

                // 2. Prepare Transaction Parameters
                const slippageTolerance = new Percent('50', '10000'); // 0.5%
                const amountIn = ethers.parseUnits(trade.inputAmount.toExact(), token0.decimals); // Raw amount as BigNumber
                const amountOutMinString = trade.minimumAmountOut(slippageTolerance).toExact(); // Minimum output amount as string
                const amountOutMin = ethers.parseUnits(amountOutMinString, token1.decimals); // Minimum output as BigNumber
                const path = route.path.map((token) => token.address); // Array of token addresses
                const to = address; // Recipient address
                const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

                console.log('Swap Parameters:');
                console.log(
                    '  Amount In:',
                    amountIn.toString(),
                    `(${trade.inputAmount.toSignificant(6)} ${token0.symbol})`
                );
                console.log(
                    '  Amount Out Min:',
                    amountOutMin.toString(),
                    `(${trade.minimumAmountOut(slippageTolerance).toSignificant(6)} ${token1.symbol})`
                );
                console.log('  Path:', path.join(' -> '));
                console.log('  To:', to);
                console.log('  Deadline:', new Date(deadline * 1000).toLocaleString());

                // 3. Check and Request Approval (if necessary)
                const approved = await checkAndRequestApproval(amountIn);
                if (!approved) {
                    console.error('Token approval failed or was rejected.');
                    return null;
                }
                console.log('Token approval sufficient.');

                // 4. Create Router Contract Instance
                const routerContract = new ethers.Contract(UNISWAP_V2_ROUTER_ADDRESS, uniswapV2RouterAbi, signer);

                // 5. Execute Swap
                console.log('Sending swap transaction...');
                const swapTx = await routerContract.swapExactTokensForTokens(
                    amountIn,
                    amountOutMin,
                    path,
                    to,
                    deadline,
                    {
                        // You might need to estimate or set gas limits depending on the network
                        // gasLimit: ethers.utils.hexlify(300000) // Example gas limit
                    }
                );

                console.log('Swap transaction sent:', swapTx.hash);

                // (Optional) Wait for transaction confirmation
                // console.log("Waiting for swap confirmation...");
                // const receipt = await swapTx.wait(1);
                // console.log("Swap confirmed in block:", receipt.blockNumber);

                return swapTx.hash;
            } catch (error) {
                console.error('Error executing swap:', error);
                // Better error handling: Check for common issues
                if (error instanceof Error) {
                    if (error.message.includes('insufficient funds')) {
                        console.error('Swap failed: Insufficient funds for gas or token amount.');
                    } else if (error.message.includes('user rejected transaction')) {
                        console.error('Swap failed: User rejected the transaction.');
                    } else if (error.message.includes('UniswapV2Router: EXPIRED')) {
                        console.error('Swap failed: Transaction deadline expired.');
                    } else if (error.message.includes('UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT')) {
                        console.error(
                            'Swap failed: Insufficient output amount due to slippage. Try increasing slippage tolerance or amount.'
                        );
                    } else if (error.message.includes('call revert exception')) {
                        // Could be many things: pair doesn't exist, insufficient liquidity, etc.
                        console.error(
                            'Swap failed: Transaction reverted. Check pair liquidity, token approvals, and parameters.'
                        );
                    }
                }
                return null;
            }
        },
        [signer, address, isConnected, token0, token1, connector, getTradeDetails, checkAndRequestApproval]
    ); // Add dependencies

    // Return the executeSwap function and others as needed
    return {
        pairTokens,
        setPairTokens,
        direction,
        setDirection,
        token0, // Expose calculated tokens
        token1,
        getPair: async () => {
            // Wrap getPair for external use
            const provider = await connector?.getProvider();
            if (!provider) return null;
            return getPair(provider);
        },
        getTradeDetails: async (inputAmountRaw: string) => {
            // Wrap getTradeDetails
            const provider = await connector?.getProvider();
            if (!provider) return { trade: null, route: null };
            return getTradeDetails(inputAmountRaw, provider);
        },
        checkAndRequestApproval,
        executeSwap,
    };
};

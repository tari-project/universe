/* eslint-disable @typescript-eslint/no-explicit-any */
import { Token, WETH9, Ether, NativeCurrency, CurrencyAmount } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import {
    Contract,
    Signer as EthersSigner,
    TransactionResponse,
    TransactionReceipt,
    AbiCoder,
    TypedDataDomain,
    TypedDataField,
} from 'ethers';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { maxInt160 as ethersMaxUint160, PublicClient as ViemPublicClient } from 'viem';

import {
    UNIVERSAL_ROUTER_ADDRESSES as UNIVERSAL_ROUTER_ADDRESSES,
    universalRouterAbi,
    QUOTER_ADDRESSES_V3,
    XTM_SDK_TOKEN,
    KNOWN_SDK_TOKENS,
    DEADLINE_MINUTES,
    PERMIT2_ADDRESS, // You need to define this in constants.ts
    PERMIT2_SPENDER_ADDRESS, // You need to define this in constants.ts (often Universal Router address)
} from './lib/constants';
import { encodePath as encodeV3Path, walletClientToSigner } from './lib/utils';
import { V3TradeDetails, SwapField, SwapDirection, TradeLeg } from './lib/types';
import { useConfigCoreStore } from '@app/store';
import { useUniswapV3Pathfinder } from './useUniswapV3Pathfinder';

const COMMAND_BYTE = {
    V3_SWAP_EXACT_IN: '00',
    PERMIT2_PERMIT: '0a',
    WRAP_ETH: '0b',
    UNWRAP_WETH: '0c',
};
const ROUTER_AS_RECIPIENT = '0x0000000000000000000000000000000000000000';

interface PermitDetails {
    token: string;
    amount: bigint;
    expiration: number;
    nonce: number;
}
interface PermitSingle {
    details: PermitDetails;
    spender: string;
    sigDeadline: number;
}
const EIP712_PERMIT2_DOMAIN_NAME = 'Permit2';
const PERMIT_TYPES: Record<string, TypedDataField[]> = {
    PermitDetails: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint160' },
        { name: 'expiration', type: 'uint48' },
        { name: 'nonce', type: 'uint48' },
    ],
    PermitSingle: [
        { name: 'details', type: 'PermitDetails' },
        { name: 'spender', type: 'address' },
        { name: 'sigDeadline', type: 'uint256' },
    ],
};

async function getPermit2Nonce(
    publicClient: ViemPublicClient,
    permit2Address: string,
    ownerAddress: string,
    tokenAddress: string,
    spenderAddress: string
): Promise<bigint> {
    try {
        const data = await publicClient.readContract({
            address: permit2Address as `0x${string}`,
            abi: [
                {
                    inputs: [
                        { name: 'user', type: 'address' },
                        { name: 'token', type: 'address' },
                        { name: 'spender', type: 'address' },
                    ],
                    name: 'allowance',
                    outputs: [
                        { name: 'amount', type: 'uint160' },
                        { name: 'expiration', type: 'uint48' },
                        { name: 'nonce', type: 'uint48' },
                    ],
                    stateMutability: 'view',
                    type: 'function',
                },
            ],
            functionName: 'allowance',
            args: [ownerAddress as `0x${string}`, tokenAddress as `0x${string}`, spenderAddress as `0x${string}`],
        });
        return BigInt(data[2].toString());
    } catch (e) {
        console.error('Failed to fetch Permit2 nonce, defaulting to 0. THIS IS UNSAFE FOR PRODUCTION.', e);
        return 0n;
    }
}

async function signPermit2Data(
    signer: EthersSigner,
    permitAddress: string,
    chainId: number,
    owner: string,
    token: string,
    amount: bigint,
    expiration: bigint,
    nonce: bigint,
    spender: string,
    sigDeadline: bigint
): Promise<{ permitSingleData: PermitSingle; signature: string } | null> {
    const domain: TypedDataDomain = {
        name: EIP712_PERMIT2_DOMAIN_NAME,
        chainId: chainId,
        verifyingContract: permitAddress,
    };

    const message: PermitSingle = {
        details: {
            token: token,
            amount: amount,
            expiration: Number(expiration),
            nonce: Number(nonce),
        },
        spender: spender,
        sigDeadline: Number(sigDeadline),
    };

    try {
        const signature = await signer.signTypedData(domain, PERMIT_TYPES, message);
        return { permitSingleData: message, signature };
    } catch (e) {
        console.error('Error signing Permit2 message:', e);
        return null;
    }
}

export const useUniswapV3Interactions = () => {
    const [pairTokenAddress, setPairTokenAddress] = useState<`0x${string}` | null>(null);
    const [direction, setDirection] = useState<SwapDirection>('toXtm');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [insufficientLiquidity, setInsufficientLiquidity] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isFetchingPool, setIsFetchingPool] = useState(false);
    const abortApproveControllerRef = useRef<AbortController | null>(null);

    const { address: accountAddress, isConnected, chain } = useAccount();
    const { data: walletClient } = useWalletClient();

    const defaultChainId = useConfigCoreStore((s) => s.default_chain);
    const currentChainId = useMemo(() => chain?.id || defaultChainId, [chain?.id, defaultChainId]);
    const publicClient = usePublicClient({ chainId: currentChainId }) as ViemPublicClient;

    const universalRouterAddress = useMemo(
        () => (currentChainId ? UNIVERSAL_ROUTER_ADDRESSES[currentChainId] : undefined),
        [currentChainId]
    );
    const v3QuoterAddress = useMemo(
        () => (currentChainId ? QUOTER_ADDRESSES_V3[currentChainId] : undefined),
        [currentChainId]
    );

    const xtmTokenForSwap = useMemo(
        () => (currentChainId ? XTM_SDK_TOKEN[currentChainId] : undefined),
        [currentChainId]
    );

    const [signer, setSigner] = useState<EthersSigner | null>(null);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (walletClient) {
                const s = await walletClientToSigner(walletClient);
                if (!cancelled) {
                    setSigner(s);
                }
            } else if (!cancelled) {
                setSigner(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [walletClient]);

    const sdkPairTokenForSwap = useMemo(() => {
        if (!currentChainId) return undefined;
        if (pairTokenAddress === null) return Ether.onChain(currentChainId);
        const lowerCaseAddress = pairTokenAddress.toLowerCase() as `0x${string}`;
        const currentWeth = WETH9[currentChainId as keyof typeof WETH9];
        if (currentWeth && lowerCaseAddress === currentWeth.address.toLowerCase()) {
            return Ether.onChain(currentChainId);
        }
        return KNOWN_SDK_TOKENS[currentChainId]?.[lowerCaseAddress] || undefined;
    }, [pairTokenAddress, currentChainId]);

    const { sdkToken0, sdkToken1 } = useMemo(() => {
        const _sdkToken0 = direction === 'toXtm' ? sdkPairTokenForSwap : xtmTokenForSwap;
        const _sdkToken1 = direction === 'toXtm' ? xtmTokenForSwap : sdkPairTokenForSwap;
        return { sdkToken0: _sdkToken0, sdkToken1: _sdkToken1 };
    }, [sdkPairTokenForSwap, xtmTokenForSwap, direction]);

    const { token0: uiToken0, token1: uiToken1 } = useMemo((): {
        token0: Token | NativeCurrency | undefined;
        token1: Token | NativeCurrency | undefined;
    } => {
        if (!currentChainId) return { token0: undefined, token1: undefined };
        let _uiInputToken: Token | NativeCurrency | undefined;
        let _uiOutputToken: Token | NativeCurrency | undefined;
        let selectedPairSideTokenForSwapUi: Token | NativeCurrency | undefined;

        if (pairTokenAddress === null) {
            selectedPairSideTokenForSwapUi = Ether.onChain(currentChainId);
        } else {
            const currentWeth = WETH9[currentChainId as keyof typeof WETH9];
            const lowerCaseAddress = pairTokenAddress.toLowerCase() as `0x${string}`;
            if (currentWeth && lowerCaseAddress === currentWeth.address.toLowerCase()) {
                selectedPairSideTokenForSwapUi = Ether.onChain(currentChainId);
            } else {
                selectedPairSideTokenForSwapUi = KNOWN_SDK_TOKENS[currentChainId]?.[lowerCaseAddress];
            }
        }
        const _xtmUiToken = xtmTokenForSwap;

        if (direction === 'toXtm') {
            _uiInputToken = selectedPairSideTokenForSwapUi;
            _uiOutputToken = _xtmUiToken;
        } else {
            _uiInputToken = _xtmUiToken;
            _uiOutputToken = selectedPairSideTokenForSwapUi;
        }
        return { token0: _uiInputToken, token1: _uiOutputToken };
    }, [pairTokenAddress, xtmTokenForSwap, direction, currentChainId]);

    useEffect(() => {
        setError(null);
        setInsufficientLiquidity(false);
    }, [sdkToken0, sdkToken1, pairTokenAddress, direction, currentChainId]);

    const { getBestTradeForAmount: getPathfinderTradeDetails } = useUniswapV3Pathfinder({
        currentChainId,
        uiToken0,
        uiToken1,
    });

    const getTradeDetails = useCallback(
        async (
            amountRaw: string,
            amountType: SwapField,
            _feeAmountParamIgnored?: FeeAmount,
            signal?: AbortSignal
        ): Promise<V3TradeDetails> => {
            setIsFetchingPool(true);
            setError(null);
            setInsufficientLiquidity(false);
            const result = await getPathfinderTradeDetails(amountRaw, amountType, signal);
            setIsFetchingPool(false);
            if (result.error) {
                setError(result.error);
                setInsufficientLiquidity(true);
            }
            const outputAmountQuotient = result.tradeDetails?.outputAmount?.quotient;
            if (outputAmountQuotient === undefined || BigInt(outputAmountQuotient.toString()) === 0n) {
                if (!result.error) setInsufficientLiquidity(true);
            }

            const defaultInputCurrency = uiToken0 || (currentChainId ? Ether.onChain(currentChainId) : undefined);
            const defaultOutputCurrency = uiToken1 || (currentChainId ? Ether.onChain(currentChainId) : undefined);

            const defaultTrade: V3TradeDetails = {
                inputToken: defaultInputCurrency!,
                outputToken: defaultOutputCurrency!,
                inputAmount: defaultInputCurrency
                    ? CurrencyAmount.fromRawAmount(defaultInputCurrency, '0')
                    : undefined!,
                outputAmount: defaultOutputCurrency
                    ? CurrencyAmount.fromRawAmount(defaultOutputCurrency, '0')
                    : undefined!,
                minimumReceived: defaultOutputCurrency
                    ? CurrencyAmount.fromRawAmount(defaultOutputCurrency, '0')
                    : undefined!,
                executionPrice: undefined!,
                priceImpactPercent: null,
                estimatedGasFeeNative: null,
                path: [],
            };
            return result.tradeDetails || defaultTrade;
        },
        [getPathfinderTradeDetails, uiToken0, uiToken1, currentChainId]
    );

    const executeSwap = useCallback(
        async (
            tradeDetailsToExecute: V3TradeDetails
        ): Promise<{ response: TransactionResponse; receipt: TransactionReceipt } | null> => {
            setError(null);
            setIsLoading(true);

            const inputCurrency = tradeDetailsToExecute?.inputAmount?.currency;
            const outputCurrency = tradeDetailsToExecute?.outputAmount?.currency;

            if (
                !signer ||
                !accountAddress ||
                !isConnected ||
                !universalRouterAddress ||
                !currentChainId ||
                !inputCurrency ||
                !outputCurrency ||
                !tradeDetailsToExecute.inputAmount ||
                !tradeDetailsToExecute.outputAmount ||
                !tradeDetailsToExecute.minimumReceived ||
                !tradeDetailsToExecute.path ||
                tradeDetailsToExecute.path.length === 0 ||
                !PERMIT2_ADDRESS ||
                !PERMIT2_SPENDER_ADDRESS
            ) {
                setError('Swap prerequisites not met for Universal Router execution (Permit2).');
                setIsLoading(false);
                return null;
            }

            const commandsHexList: string[] = [];
            const encodedInputs: string[] = [];
            const abiCoder = AbiCoder.defaultAbiCoder();
            const txOptions: { value?: bigint; gasLimit?: bigint } = {};

            try {
                if (!inputCurrency.isNative) {
                    setIsApproving(true);
                    const tokenToPermit = inputCurrency as Token;
                    const permitAmount = ethersMaxUint160;
                    const permitExpiration = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60);
                    const permitNonce = await getPermit2Nonce(
                        publicClient,
                        PERMIT2_ADDRESS[currentChainId],
                        accountAddress,
                        tokenToPermit.address,
                        PERMIT2_SPENDER_ADDRESS[currentChainId]
                    );
                    const txDeadlineForPermit = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60);
                    const permitSigDeadline = txDeadlineForPermit + 600n;

                    const permitResult = await signPermit2Data(
                        signer,
                        PERMIT2_ADDRESS[currentChainId],
                        currentChainId,
                        accountAddress,
                        tokenToPermit.address,
                        permitAmount,
                        permitExpiration,
                        permitNonce,
                        PERMIT2_SPENDER_ADDRESS[currentChainId],
                        permitSigDeadline
                    );
                    setIsApproving(false);

                    if (!permitResult) {
                        setError('Failed to sign Permit2 message.');
                        setIsLoading(false);
                        return null;
                    }

                    commandsHexList.push(COMMAND_BYTE.PERMIT2_PERMIT);
                    encodedInputs.push(
                        abiCoder.encode(
                            [
                                '(address token,uint160 amount,uint48 expiration,uint48 nonce) details',
                                'address spender',
                                'uint256 sigDeadline',
                                'bytes signature',
                            ],
                            [
                                permitResult.permitSingleData.details,
                                permitResult.permitSingleData.spender,
                                permitResult.permitSingleData.sigDeadline,
                                permitResult.signature,
                            ]
                        )
                    );
                } else {
                    commandsHexList.push(COMMAND_BYTE.WRAP_ETH);
                    encodedInputs.push(
                        abiCoder.encode(
                            ['address', 'uint256'],
                            [universalRouterAddress, BigInt(tradeDetailsToExecute.inputAmount.quotient.toString())]
                        )
                    );
                    txOptions.value = BigInt(tradeDetailsToExecute.inputAmount.quotient.toString());
                }

                const amountInForSwap = BigInt(tradeDetailsToExecute.inputAmount.quotient.toString());
                const amountOutMinForSwap = BigInt(tradeDetailsToExecute.minimumReceived.quotient.toString());

                const v3PathTokens: `0x${string}`[] = [tradeDetailsToExecute.path[0].tokenIn.address as `0x${string}`];
                const v3PathFees: FeeAmount[] = [];
                tradeDetailsToExecute.path.forEach((leg: TradeLeg) => {
                    v3PathTokens.push(leg.tokenOut.address as `0x${string}`);
                    v3PathFees.push(leg.fee);
                });
                const v3EncodedPathBytes = encodeV3Path(v3PathTokens, v3PathFees);

                let recipientForV3Swap: `0x${string}` = accountAddress as `0x${string}`;
                if (outputCurrency.isNative) {
                    recipientForV3Swap = ROUTER_AS_RECIPIENT as `0x${string}`;
                }

                commandsHexList.push(COMMAND_BYTE.V3_SWAP_EXACT_IN);
                encodedInputs.push(
                    abiCoder.encode(
                        ['address', 'uint256', 'uint256', 'bytes', 'bool'],
                        [
                            recipientForV3Swap,
                            amountInForSwap,
                            amountOutMinForSwap,
                            v3EncodedPathBytes,
                            false,
                            //!inputCurrency.isNative ? false : true,
                        ]
                    )
                );

                if (outputCurrency.isNative) {
                    commandsHexList.push(COMMAND_BYTE.UNWRAP_WETH);
                    encodedInputs.push(
                        abiCoder.encode(['address', 'uint256'], [accountAddress as `0x${string}`, amountOutMinForSwap])
                    );
                }

                const finalCommandsBytes = '0x' + commandsHexList.join('');
                const deadline = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60);
                const routerContract = new Contract(universalRouterAddress, universalRouterAbi, signer);

                try {
                    const estimatedGas = await routerContract.execute.estimateGas(
                        finalCommandsBytes,
                        encodedInputs,
                        deadline,
                        txOptions
                    );
                    if (estimatedGas) {
                        txOptions.gasLimit = (estimatedGas * 125n) / 100n;
                    }
                } catch (gasError: any) {
                    console.warn('Gas estimation failed for Universal Router execute:', gasError);
                    txOptions.gasLimit = BigInt(inputCurrency.isNative ? 300000 : 450000);
                }

                const swapTxResponse = await routerContract.execute(
                    finalCommandsBytes,
                    encodedInputs,
                    deadline,
                    txOptions
                );

                const swapTxReceipt = (await swapTxResponse.wait(1)) as TransactionReceipt;
                setIsLoading(false);

                if (swapTxReceipt?.status !== 1) {
                    throw new Error('Universal Router Swap transaction failed on-chain.');
                }
                return { response: swapTxResponse, receipt: swapTxReceipt };
            } catch (error: any) {
                let message = 'Unknown error executing swap.';
                if (error.reason) message = `Swap failed: ${error.reason}`;
                else if (error.data?.message) message = `Swap failed: ${error.data.message}`;
                else if (error.error?.message) message = `Swap failed: ${error.error.message}`;
                else if (error.message) message = `Swap failed: ${error.message}`;

                setError(message);
                setIsLoading(false);
                setIsApproving(false);
                return null;
            }
        },
        [signer, accountAddress, isConnected, universalRouterAddress, currentChainId, publicClient]
    );

    return {
        pairTokenAddress,
        direction,
        setPairTokenAddress,
        setDirection,
        token0: uiToken0,
        token1: uiToken1,
        sdkToken0,
        sdkToken1,
        isLoading: isLoading || isApproving || isFetchingPool,
        isApproving,
        isFetchingPool,
        error,
        insufficientLiquidity,
        v3RouterAddress: universalRouterAddress,
        getTradeDetails,
        executeSwap,
        isReady:
            !!publicClient &&
            !!currentChainId &&
            !!v3QuoterAddress &&
            !!signer &&
            !!accountAddress &&
            isConnected &&
            !!universalRouterAddress &&
            !!PERMIT2_ADDRESS && // Add these checks
            !!PERMIT2_SPENDER_ADDRESS,
    };
};

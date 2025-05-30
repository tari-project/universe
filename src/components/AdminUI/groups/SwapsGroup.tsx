/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable i18next/no-literal-string */
import { Button, CategoryLabel } from '../styles'; // Assuming these are correctly imported
import { useUniswapV2Interactions } from '@app/hooks/swap/useSwapV2';

import { useState, useMemo } from 'react';
import { ChainId, Token, Ether, NativeCurrency } from '@uniswap/sdk-core'; // Import Ether
import { setDefaultChain } from '@app/store/actions/appConfigStoreActions';
import { useConfigCoreStore } from '@app/store';
import { useAccount } from 'wagmi'; // To get connected chainId

// Import your token definitions (make sure paths are correct)
import {
    XTM_SDK_TOKEN,
    USDT_SDK_TOKEN,
    // KNOWN_SDK_TOKENS,
    // ENABLED_TOKEN_ADDRESSES,
    // EnabledTokensEnum,
} from '@app/hooks/swap/lib/constants';

export function SwapsGroup() {
    const { addLiquidity, removeAllLiquidity, isLoading: hookIsLoading, error: hookError } = useUniswapV2Interactions();
    const [amountA, setAmountA] = useState(''); // Generic name for first token amount
    const [amountB, setAmountB] = useState(''); // Generic name for second token amount
    const [selectedPair, setSelectedPair] = useState<'XTM-ETH' | 'XTM-MUSDC' | 'MUSDC-ETH'>('XTM-ETH'); // State to select pair

    // Use local loading and error to avoid conflicts if hook manages its own
    const [componentLoading, setComponentLoading] = useState(false);
    const [componentError, setComponentError] = useState<string | null>(null);

    const defaultChainForStore = useConfigCoreStore((s) => s.default_chain);
    const { chain: connectedChain } = useAccount();
    const currentChainId = useMemo(
        () => connectedChain?.id || defaultChainForStore,
        [connectedChain, defaultChainForStore]
    );

    // Get Token instances based on selected pair and currentChainId
    const { tokenAInstance, tokenBInstance, tokenAName, tokenBName } = useMemo(() => {
        if (!currentChainId)
            return {
                tokenAInstance: undefined,
                tokenBInstance: undefined,
                tokenAName: 'Token A',
                tokenBName: 'Token B',
            };

        let tA: Token | undefined;
        let tB: Token | NativeCurrency | undefined;
        let tAName = 'Token A';
        let tBName = 'Token B';

        const xtm = XTM_SDK_TOKEN[currentChainId];
        const musdc = USDT_SDK_TOKEN[currentChainId]; // Make sure this is defined in your constants
        const eth = Ether.onChain(currentChainId);

        switch (selectedPair) {
            case 'XTM-ETH':
                tA = xtm;
                tB = eth;
                tAName = xtm?.symbol || 'XTM';
                tBName = 'ETH';
                break;
            case 'XTM-MUSDC':
                tA = xtm;
                tB = musdc;
                tAName = xtm?.symbol || 'XTM';
                tBName = musdc?.symbol || 'MUSDC';
                break;
            case 'MUSDC-ETH':
                tA = musdc;
                tB = eth;
                tAName = musdc?.symbol || 'MUSDC';
                tBName = 'ETH';
                break;
            default:
                break;
        }
        return { tokenAInstance: tA, tokenBInstance: tB, tokenAName: tAName, tokenBName: tBName };
    }, [selectedPair, currentChainId]);

    const handleToggleChain = () => {
        if (defaultChainForStore === ChainId.MAINNET) {
            setDefaultChain(ChainId.SEPOLIA);
        } else {
            setDefaultChain(ChainId.MAINNET);
        }
    };

    const isValidNumber = (val: string) => {
        if (val.trim() === '') return false; // Allow empty string to clear input, but not valid for submission
        const num = Number(val);
        return !isNaN(num) && num >= 0; // Allow 0 for optional amount, validation for >0 done in hook
    };

    const handleAddLiquidity = async () => {
        if (!tokenAInstance || !tokenBInstance) {
            setComponentError('Tokens for the selected pair are not available on this chain.');
            return;
        }
        if (!isValidNumber(amountA) || Number(amountA) <= 0) {
            setComponentError(`${tokenAName} amount must be a positive number.`);
            return;
        }
        // Amount B can be optional (0 or empty string), hook will calculate or require if pool is new
        const numAmountA = Number(amountA);
        const numAmountB = amountB.trim() !== '' && isValidNumber(amountB) ? Number(amountB) : undefined;

        setComponentError(null);
        setComponentLoading(true);
        try {
            await addLiquidity({
                tokenA: tokenAInstance,
                tokenB: tokenBInstance,
                amountADesired: numAmountA,
                amountBDesired: numAmountB,
            });
            setAmountA('');
            setAmountB('');
            // Success toast is handled by the hook
        } catch (e: any) {
            // Error toast might be handled by hook, or set local error
            setComponentError(e?.message || 'Failed to add liquidity (component error)');
        } finally {
            setComponentLoading(false);
        }
    };

    const handleRemoveAllLiquidity = async () => {
        if (!tokenAInstance || !tokenBInstance) {
            setComponentError('Tokens for the selected pair are not available on this chain for removal.');
            return;
        }
        setComponentError(null);
        setComponentLoading(true);
        try {
            await removeAllLiquidity(tokenAInstance, tokenBInstance);
            // Success toast is handled by the hook
        } catch (e: any) {
            // Error toast might be handled by hook, or set local error
            setComponentError(e?.message || 'Failed to remove all liquidity (component error)');
        } finally {
            setComponentLoading(false);
        }
    };

    const addLiquidityDisabled = componentLoading || hookIsLoading || !isValidNumber(amountA) || Number(amountA) <= 0;
    const removeLiquidityDisabled = componentLoading || hookIsLoading;

    // Helper to get chain name
    const getChainName = (chainId: number) => {
        switch (chainId) {
            case ChainId.MAINNET:
                return 'Mainnet';
            case ChainId.SEPOLIA:
                return 'Sepolia';
            default:
                return `Chain ${chainId}`;
        }
    };

    return (
        <>
            <CategoryLabel>Dev Admin Controls (Liquidity)</CategoryLabel>
            <div style={{ marginBottom: 16, border: '1px solid #444', padding: 16, borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 14, color: '#ddd' }}>
                        Default Chain (No Wallet): <b>{getChainName(defaultChainForStore)}</b>
                    </span>
                    <Button onClick={handleToggleChain} style={{ padding: '4px 12px' }}>
                        Toggle Default Chain
                    </Button>
                </div>
                {connectedChain && (
                    <div style={{ marginBottom: 16, fontSize: 14, color: '#ddd' }}>
                        Connected Wallet Chain: <b>{getChainName(connectedChain.id)}</b> (Using this for operations)
                    </div>
                )}

                <div style={{ marginBottom: 16 }}>
                    <label htmlFor="pair-select" style={{ color: '#ddd', marginRight: 8 }}>
                        Select Pair:
                    </label>
                    <select
                        id="pair-select"
                        value={selectedPair}
                        onChange={(e) => setSelectedPair(e.target.value as 'XTM-ETH' | 'XTM-MUSDC' | 'MUSDC-ETH')}
                        style={{
                            padding: 8,
                            borderRadius: 4,
                            background: '#333',
                            color: '#fff',
                            border: '1px solid #555',
                        }}
                    >
                        <option value="XTM-ETH">XTM - ETH</option>
                        <option value="XTM-MUSDC">XTM - MUSDC</option>
                        <option value="MUSDC-ETH">MUSDC - ETH</option>
                    </select>
                </div>

                <CategoryLabel>
                    Add Liquidity for {tokenAName} / {tokenBName}
                </CategoryLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder={`${tokenAName} Amount (Required)`}
                        value={amountA}
                        onChange={(e) => setAmountA(e.target.value)}
                        style={{
                            padding: 8,
                            borderRadius: 4,
                            background: '#222',
                            color: '#fff',
                            border: '1px solid #555',
                        }}
                    />
                    <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder={`${tokenBName} Amount (Optional)`}
                        value={amountB}
                        onChange={(e) => setAmountB(e.target.value)}
                        style={{
                            padding: 8,
                            borderRadius: 4,
                            background: '#222',
                            color: '#fff',
                            border: '1px solid #555',
                        }}
                    />
                    <Button
                        onClick={handleAddLiquidity}
                        disabled={addLiquidityDisabled}
                        style={{ marginTop: 8, textAlign: 'center', opacity: addLiquidityDisabled ? 0.5 : 1 }}
                    >
                        {componentLoading || hookIsLoading
                            ? 'Processing...'
                            : `Add ${tokenAName}/${tokenBName} Liquidity`}
                    </Button>
                    {(componentError || hookError) && (
                        <div style={{ color: 'red', marginTop: 4, fontSize: 12 }}>{componentError || hookError}</div>
                    )}
                </div>

                <CategoryLabel style={{ marginTop: 24 }}>
                    Remove All Liquidity for {tokenAName} / {tokenBName}
                </CategoryLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Button
                        onClick={handleRemoveAllLiquidity}
                        disabled={removeLiquidityDisabled}
                        style={{ marginTop: 8, textAlign: 'center', opacity: removeLiquidityDisabled ? 0.5 : 1 }}
                    >
                        {componentLoading || hookIsLoading
                            ? 'Processing...'
                            : `Remove All ${tokenAName}/${tokenBName} Liquidity`}
                    </Button>
                    {(componentError || hookError) &&
                        !componentLoading &&
                        !hookIsLoading && ( // Show error only if not loading
                            <div style={{ color: 'red', marginTop: 4, fontSize: 12 }}>
                                {componentError || hookError}
                            </div>
                        )}
                </div>
            </div>
        </>
    );
}

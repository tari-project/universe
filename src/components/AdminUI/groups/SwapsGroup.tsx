/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable i18next/no-literal-string */
import { Button, CategoryLabel } from '../styles';
import { useUniswapV2Interactions } from '@app/hooks/swap/useSwapV2';

import { useState } from 'react';
import { ChainId } from '@uniswap/sdk-core';
import { setDefaultChain } from '@app/store/actions/appConfigStoreActions';
import { useConfigCoreStore } from '@app/store';

export function SwapsGroup() {
    const { addLiquidity, removeAllLiquidity } = useUniswapV2Interactions();
    const [xtmAmount, setXtmAmount] = useState('');
    const [ethAmount, setEthAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const defaultChain = useConfigCoreStore((s) => s.default_chain);

    const handleToggleChain = () => {
        if (defaultChain === ChainId.MAINNET) {
            setDefaultChain(ChainId.SEPOLIA);
        } else {
            setDefaultChain(ChainId.MAINNET);
        }
        console.log('setDefaultChain', defaultChain);
    };

    const isValidNumber = (val: string) => {
        if (val === '') return false;
        return !isNaN(Number(val)) && Number(val) > 0;
    };

    const handleAddLiquidity = async () => {
        setError(null);
        setLoading(true);
        try {
            await addLiquidity({
                xtmAmount: Number(xtmAmount),
                ethAmount: Number(ethAmount),
            });
            setXtmAmount('');
        } catch (e: any) {
            setError(e?.message || 'Failed to add liquidity');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAllLiquidity = async () => {
        setError(null);
        setLoading(true);
        try {
            await removeAllLiquidity();
            setXtmAmount('');
        } catch (e: any) {
            setError(e?.message || 'Failed to remove all liquidity');
        } finally {
            setLoading(false);
        }
    };

    const disabled = loading || !isValidNumber(xtmAmount);

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
            <CategoryLabel>Default Chain (when wallet is not connected)</CategoryLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 14, color: '#fff' }}>
                    Current Chain: <b>{getChainName(defaultChain)}</b>
                </span>
                <Button onClick={handleToggleChain} style={{ padding: '4px 12px' }}>
                    Toggle Chain
                </Button>
            </div>
            <CategoryLabel>Add Liquidity on Uniswap for wXTM</CategoryLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="XTM Amount"
                    value={xtmAmount}
                    onChange={(e) => setXtmAmount(e.target.value)}
                    style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                />
                <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="ETH Amount"
                    value={ethAmount}
                    onChange={(e) => setEthAmount(e.target.value)}
                    style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                />
                <Button
                    onClick={handleAddLiquidity}
                    disabled={disabled}
                    style={{ marginTop: 8, textAlign: 'center', opacity: disabled ? 0.5 : 1 }}
                >
                    {loading ? 'Adding...' : 'Add Liquidity'}
                </Button>
                {error && <div style={{ color: 'red', marginTop: 4 }}>{error}</div>}
            </div>
            <CategoryLabel>Remove all Liquidity on Uniswap</CategoryLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Button
                    onClick={handleRemoveAllLiquidity}
                    disabled={loading}
                    style={{ marginTop: 8, textAlign: 'center', opacity: loading ? 0.5 : 1 }}
                >
                    {loading ? 'Removing...' : 'Remove All Liquidity'}
                </Button>
                {error && <div style={{ color: 'red', marginTop: 4 }}>{error}</div>}
            </div>
        </>
    );
}

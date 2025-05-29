/* eslint-disable i18next/no-literal-string */
import { Button, CategoryLabel } from '../styles'; // Assuming these are correctly imported

import { ChainId } from '@uniswap/sdk-core'; // Import Ether
import { setDefaultChain } from '@app/store/actions/appConfigStoreActions';
import { useConfigCoreStore } from '@app/store';
import { useAccount } from 'wagmi'; // To get connected chainId

// Import your token definitions (make sure paths are correct)

export function SwapsGroup() {
    // Use local loading and error to avoid conflicts if hook manages its own

    const defaultChainForStore = useConfigCoreStore((s) => s.default_chain);
    const { chain: connectedChain } = useAccount();
    const handleToggleChain = () => {
        if (defaultChainForStore === ChainId.MAINNET) {
            setDefaultChain(ChainId.SEPOLIA);
        } else {
            setDefaultChain(ChainId.MAINNET);
        }
    };

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
            </div>
        </>
    );
}

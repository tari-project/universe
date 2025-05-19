import { WalletClient } from 'viem';
import { BrowserProvider, Signer as EthersSigner } from 'ethers';
import { formatUnits as viemFormatUnits } from 'viem';

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

export const formatNativeGasFee = (
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

export const formatGasFeeUSD = (
    feeInNativeNum: number | undefined,
    nativePriceUSD: number | undefined
): string | null => {
    if (feeInNativeNum === undefined || nativePriceUSD === undefined) return null;
    const usdValue = feeInNativeNum * nativePriceUSD;
    return `$${usdValue.toFixed(2)}`;
};

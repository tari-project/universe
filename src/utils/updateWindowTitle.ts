import { Network } from './network';

/**
 * Updates the browser window title to display the current network
 * @param network - The current network (mainnet, testnet, etc.)
 */
export function updateWindowTitle(network?: Network): void {
    if (!network) {
        document.title = 'Tari Universe';
        return;
    }

    // Format network name for display
    const networkDisplayName = formatNetworkName(network);
    document.title = `Tari Universe | ${networkDisplayName}`;
}

/**
 * Formats the network name for display in the window title
 * @param network - The network to format
 * @returns Formatted network name
 */
function formatNetworkName(network: Network): string {
    switch (network) {
        case Network.MainNet:
            return 'Mainnet';
        case Network.StageNet:
            return 'Stagenet';
        case Network.NextNet:
            return 'Nextnet';
        case Network.Esmeralda:
            return 'Esmeralda';
        case Network.Igor:
            return 'Igor';
        case Network.LocalNet:
            return 'Localnet';
        default:
            return network;
    }
}

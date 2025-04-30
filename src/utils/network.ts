export enum Network {
    MainNet = 'mainnet',
    StageNet = 'stagenet',
    NextNet = 'nextnet',
    LocalNet = 'localnet',
    Igor = 'igor',
    Esmeralda = 'esmeralda',
}

export function isTestnet(network: Network | undefined): boolean {
    if (!network) {
        return false;
    }
    return network === Network.LocalNet || network === Network.Esmeralda || network === Network.Igor;
}

export function isStagenet(network: Network | undefined): boolean {
    if (!network) {
        return false;
    }
    return network === Network.StageNet || network === Network.NextNet;
}

export function isMainNet(network: Network | undefined): boolean {
    if (!network) {
        return false;
    }
    return network === Network.MainNet;
}

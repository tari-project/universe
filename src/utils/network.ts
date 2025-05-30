export enum Network {
    MainNet = 'mainnet',
    StageNet = 'stagenet',
    NextNet = 'nextnet',
    LocalNet = 'localnet',
    Igor = 'igor',
    Esmeralda = 'esmeralda',
}

export function isMainNet(network: Network | undefined): boolean {
    if (!network) {
        return false;
    }
    return network === Network.MainNet;
}

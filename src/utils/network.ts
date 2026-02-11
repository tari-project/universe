import { useMiningStore } from '@app/store';

type NetworkGroup = 'testnet' | 'stagenet' | 'mainnet';
export enum Network {
    MainNet = 'mainnet',
    StageNet = 'stagenet',
    NextNet = 'nextnet',
    LocalNet = 'localnet',
    Igor = 'igor',
    Esmeralda = 'esmeralda',
}

const networkGroups: Record<NetworkGroup, Network[]> = {
    testnet: [Network.LocalNet, Network.Esmeralda, Network.Igor],
    stagenet: [Network.StageNet, Network.NextNet],
    mainnet: [Network.MainNet],
};

export function isLocalNet(): boolean {
    const storedNetwork = useMiningStore.getState().network;
    return storedNetwork === Network.LocalNet;
}

export function isMainNet(): boolean {
    const storedNetwork = useMiningStore.getState().network;
    const _network = Object.values(Network).find((network) => network === storedNetwork);
    return _network ? networkGroups.mainnet.includes(_network) : false;
}

export function getNetworkGroup() {
    const storedNetwork = useMiningStore.getState().network;
    if (!storedNetwork) getNetworkGroup();
    const _network = Object.values(Network).find((network) => network === storedNetwork);
    return Object.keys(networkGroups).find((key) => networkGroups[key].includes(_network));
}

const urlSuffixMap = {
    testnet: '-esmeralda',
    stagenet: '-nextnet',
    mainnet: '',
};

export function getExplorerUrl(nonTextExplorer = false) {
    const baseSubdomain = nonTextExplorer ? `explore` : `textexplore`;
    const networkGroup = getNetworkGroup() || 'mainnet';
    const subdomainSuffix = urlSuffixMap[networkGroup] ?? '';
    return `https://${baseSubdomain}${subdomainSuffix}.tari.com`;
}

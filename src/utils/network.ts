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

const storedNetwork = useMiningStore.getState().network;
const _network = Object.values(Network).find((network) => network === storedNetwork);

function _isTestnet(): boolean {
    return _network ? networkGroups.testnet.includes(_network) : false;
}

function _isStagenet(): boolean {
    return _network ? networkGroups.stagenet.includes(_network) : false;
}

export function isMainNet(): boolean {
    return _network ? networkGroups.mainnet.includes(_network) : false;
}

export function getNetworkGroup() {
    return Object.keys(networkGroups).find((key) => networkGroups[key].includes(_network));
}

const urlSuffixMap = {
    testnet: '-esmeralda',
    stagenet: '-nextnet',
    mainnet: '',
};

export function getExplorerUrl(nonTextExplorer = false) {
    const baseSubdomain = nonTextExplorer ? `explore` : `textexplore`;
    const networkGroup = getNetworkGroup();
    if (networkGroup) {
        const subdomainSuffix = urlSuffixMap[networkGroup] ?? '';

        return `https://${baseSubdomain}${subdomainSuffix}.tari.com`;
    }
}

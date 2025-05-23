import { useMiningStore } from '@app/store';

export enum Network {
    MainNet = 'mainnet',
    StageNet = 'stagenet',
    NextNet = 'nextnet',
    LocalNet = 'localnet',
    Igor = 'igor',
    Esmeralda = 'esmeralda',
}
const storedNetwork = useMiningStore.getState().network;
const _network = Object.values(Network).find((network) => network === storedNetwork);

export function isTestnet(network: Network | undefined = _network): boolean {
    if (!network) {
        return false;
    }
    return network === Network.LocalNet || network === Network.Esmeralda || network === Network.Igor;
}

export function isStagenet(network: Network | undefined = _network): boolean {
    if (!network) {
        return false;
    }
    return network === Network.StageNet || network === Network.NextNet;
}

export function isMainNet(network: Network | undefined = _network): boolean {
    if (!network) {
        return false;
    }
    return network === Network.MainNet;
}

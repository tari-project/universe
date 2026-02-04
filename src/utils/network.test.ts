import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Network } from './network';

// Mock the mining store
const mockGetState = vi.fn();

vi.mock('@app/store', () => ({
    useMiningStore: {
        getState: () => mockGetState(),
    },
}));

// Import functions after mock is set up
import { isMainNet, getNetworkGroup, getExplorerUrl } from './network';

describe('network utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Network enum', () => {
        it('has correct values for all networks', () => {
            expect(Network.MainNet).toBe('mainnet');
            expect(Network.StageNet).toBe('stagenet');
            expect(Network.NextNet).toBe('nextnet');
            expect(Network.LocalNet).toBe('localnet');
            expect(Network.Igor).toBe('igor');
            expect(Network.Esmeralda).toBe('esmeralda');
        });
    });

    describe('isMainNet', () => {
        it('returns true for MainNet', () => {
            mockGetState.mockReturnValue({ network: Network.MainNet });
            expect(isMainNet()).toBe(true);
        });

        it('returns false for StageNet', () => {
            mockGetState.mockReturnValue({ network: Network.StageNet });
            expect(isMainNet()).toBe(false);
        });

        it('returns false for NextNet', () => {
            mockGetState.mockReturnValue({ network: Network.NextNet });
            expect(isMainNet()).toBe(false);
        });

        it('returns false for LocalNet', () => {
            mockGetState.mockReturnValue({ network: Network.LocalNet });
            expect(isMainNet()).toBe(false);
        });

        it('returns false for Igor', () => {
            mockGetState.mockReturnValue({ network: Network.Igor });
            expect(isMainNet()).toBe(false);
        });

        it('returns false for Esmeralda', () => {
            mockGetState.mockReturnValue({ network: Network.Esmeralda });
            expect(isMainNet()).toBe(false);
        });

        it('returns false when network is undefined', () => {
            mockGetState.mockReturnValue({ network: undefined });
            expect(isMainNet()).toBe(false);
        });
    });

    describe('getNetworkGroup', () => {
        it('returns "mainnet" for MainNet', () => {
            mockGetState.mockReturnValue({ network: Network.MainNet });
            expect(getNetworkGroup()).toBe('mainnet');
        });

        it('returns "stagenet" for StageNet', () => {
            mockGetState.mockReturnValue({ network: Network.StageNet });
            expect(getNetworkGroup()).toBe('stagenet');
        });

        it('returns "stagenet" for NextNet', () => {
            mockGetState.mockReturnValue({ network: Network.NextNet });
            expect(getNetworkGroup()).toBe('stagenet');
        });

        it('returns "testnet" for LocalNet', () => {
            mockGetState.mockReturnValue({ network: Network.LocalNet });
            expect(getNetworkGroup()).toBe('testnet');
        });

        it('returns "testnet" for Igor', () => {
            mockGetState.mockReturnValue({ network: Network.Igor });
            expect(getNetworkGroup()).toBe('testnet');
        });

        it('returns "testnet" for Esmeralda', () => {
            mockGetState.mockReturnValue({ network: Network.Esmeralda });
            expect(getNetworkGroup()).toBe('testnet');
        });
    });

    describe('getExplorerUrl', () => {
        it('returns mainnet text explorer URL for MainNet', () => {
            mockGetState.mockReturnValue({ network: Network.MainNet });
            const url = getExplorerUrl();
            expect(url).toBe('https://textexplore.tari.com');
        });

        it('returns mainnet visual explorer URL when nonTextExplorer is true', () => {
            mockGetState.mockReturnValue({ network: Network.MainNet });
            const url = getExplorerUrl(true);
            expect(url).toBe('https://explore.tari.com');
        });

        it('returns stagenet text explorer URL for NextNet', () => {
            mockGetState.mockReturnValue({ network: Network.NextNet });
            const url = getExplorerUrl();
            expect(url).toBe('https://textexplore-nextnet.tari.com');
        });

        it('returns stagenet visual explorer URL for StageNet', () => {
            mockGetState.mockReturnValue({ network: Network.StageNet });
            const url = getExplorerUrl(true);
            expect(url).toBe('https://explore-nextnet.tari.com');
        });

        it('returns testnet text explorer URL for Esmeralda', () => {
            mockGetState.mockReturnValue({ network: Network.Esmeralda });
            const url = getExplorerUrl();
            expect(url).toBe('https://textexplore-esmeralda.tari.com');
        });

        it('returns testnet visual explorer URL for Igor', () => {
            mockGetState.mockReturnValue({ network: Network.Igor });
            const url = getExplorerUrl(true);
            expect(url).toBe('https://explore-esmeralda.tari.com');
        });
    });
});

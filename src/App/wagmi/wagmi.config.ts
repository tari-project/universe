import { createAppKit } from '@reown/appkit/react';

import { mainnet, sepolia } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'c523cd3d3e0246530115c1dc2c016852';

const metadata = {
    name: 'TariUniverse',
    description: 'Tari Universe Wallet',
    url: 'https://universe.tari.com', // origin must match your domain & subdomain
    icons: ['https://universe.tari.com/assets/tari-logo.png'],
};

import type { Network } from '@reown/appkit';

const networks: Network[] = [mainnet, sepolia];

const wagmiAdapter = new WagmiAdapter({
    networks,
    projectId,
    ssr: true,
});

export const config = wagmiAdapter.wagmiConfig;

createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId,
    metadata,
    features: {
        analytics: true, // Optional - defaults to your Cloud configuration
    },
});

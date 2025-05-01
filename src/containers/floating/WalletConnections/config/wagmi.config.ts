import { createAppKit } from '@reown/appkit/react';

import { mainnet, arbitrum, base, scroll, polygon, goerli, sepolia } from '@reown/appkit/networks';

import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

import { createStorage } from 'wagmi';

const storage = createStorage({ storage: localStorage });

// 1. Get projectId from https://cloud.reown.com
const projectId = 'c523cd3d3e0246530115c1dc2c016852';

// 2. Create a metadata object - optional
const metadata = {
    name: 'Tari Universe',
    description: 'Tari Universe',
    url: 'https://tari.com', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

// 3. Set the networks
const networks = [mainnet, arbitrum, base, scroll, polygon, goerli, sepolia];

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
    networks,
    projectId,
    storage,
    // ssr: true,
});

// 5. Create modal
createAppKit({
    adapters: [wagmiAdapter],
    networks: [mainnet, arbitrum, base, scroll, polygon, goerli, sepolia],
    projectId,
    metadata,
    debug: true,
    features: {
        // analytics: true, // Optional - defaults to your Cloud configuration
    },
});

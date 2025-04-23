import { createAppKit } from '@reown/appkit/react';

import { mainnet, arbitrum, base, scroll, polygon } from '@reown/appkit/networks';

import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

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
const networks = [mainnet, arbitrum, base, scroll, polygon];

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
    networks,
    projectId,
    // ssr: true,
});

// 5. Create modal
createAppKit({
    adapters: [wagmiAdapter],
    networks: [mainnet, arbitrum, base, scroll, polygon],
    projectId,
    metadata,
    features: {
        // analytics: true, // Optional - defaults to your Cloud configuration
    },
});

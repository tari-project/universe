import { createAppKit } from '@reown/appkit/react';

import { mainnet, sepolia } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

const projectId = 'c523cd3d3e0246530115c1dc2c016852';

const metadata = {
    name: 'TariUniverse',
    description: 'AppKit Example',
    url: 'https://reown.com/appkit', // origin must match your domain & subdomain
    icons: ['https://assets.reown.com/reown-profile-pic.png'],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const networks: any = [mainnet, sepolia];

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

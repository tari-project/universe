import { createAppKit } from '@reown/appkit/react';

import { AppKitNetwork, mainnet, sepolia } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// TODO: add project id on config
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'c523cd3d3e0246530115c1dc2c016852';

const metadata = {
    name: 'TariUniverse',
    description: 'Tari Universe Wallet',
    url: 'https://universe.tari.com',
    icons: ['https://universe.tari.com/assets/tari-logo.png'],
};

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, sepolia];

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
        analytics: true,
    },
});

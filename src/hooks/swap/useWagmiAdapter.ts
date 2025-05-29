import { createAppKit } from '@reown/appkit/react';
import { AppKitNetwork, mainnet, sepolia } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { ConfigBackendInMemory } from '@app/types/configs';
import { useConfigBEInMemoryStore } from '@app/store';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useRef, useState } from 'react';
import { http } from 'viem';
import { RPC_URLS } from './lib/constants';

const metadata = {
    name: 'Tari Universe',
    description: 'Tari Universe Wallet',
    url: 'https://tari.com',
    icons: ['https://universe.tari.com/assets/tari-logo.png'],
};

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, sepolia];

export const useWagmiAdapter = () => {
    const [projectId, setProjectId] = useState<string | undefined>(undefined);
    const [initializedAdapter, setInitializedAdapter] = useState<WagmiAdapter | undefined>(undefined);
    const [isInitializing, setIsInitializing] = useState<boolean>(false);

    useEffect(() => {
        const fetchProjectId = async () => {
            let appInMemoryConfig: ConfigBackendInMemory | undefined = useConfigBEInMemoryStore.getState();

            if (!appInMemoryConfig?.walletConnectProjectId) {
                try {
                    appInMemoryConfig = await invoke<ConfigBackendInMemory>('get_app_in_memory_config', {});
                } catch {
                    setProjectId('');
                    return;
                }
            }

            console.info('Fetched appInMemoryConfig:', appInMemoryConfig);
            if (appInMemoryConfig?.walletConnectProjectId) {
                setProjectId(appInMemoryConfig.walletConnectProjectId);
            } else {
                console.warn('walletConnectProjectId not found in config.');
                setProjectId(''); // Fallback to empty or handle error
            }
        };

        fetchProjectId();
    }, []);

    const debouncedRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (debouncedRef.current) {
            clearTimeout(debouncedRef.current);
        }

        debouncedRef.current = setTimeout(() => {
            if (projectId && !isInitializing && !initializedAdapter) {
                setIsInitializing(true);
                const wagmiAdapterInstance = new WagmiAdapter({
                    networks,
                    projectId,
                    ssr: false,
                    transports: {
                        [mainnet.id]: http(RPC_URLS[mainnet.id]),
                        [sepolia.id]: http(RPC_URLS[sepolia.id]),
                    },
                });

                createAppKit({
                    adapters: [wagmiAdapterInstance],
                    networks,
                    projectId,
                    debug: window.location.origin.startsWith('http://localhost'),
                    metadata,
                });
                setInitializedAdapter(wagmiAdapterInstance);
                setIsInitializing(false);
            } else if (projectId === '' && !isInitializing && !initializedAdapter) {
                setIsInitializing(false);
            }
        }, 1000);
    }, [projectId, initializedAdapter, isInitializing]); // Dependencies for this effect

    return initializedAdapter;
};

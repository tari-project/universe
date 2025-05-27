import { createAppKit } from '@reown/appkit/react';
import { AppKitNetwork, mainnet, sepolia } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { ConfigBackendInMemory } from '@app/types/configs';
import { useConfigBEInMemoryStore } from '@app/store';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

const metadata = {
    name: 'TariUniverse',
    description: 'Tari Universe Wallet',
    url: 'https://universe.tari.com',
    icons: ['https://universe.tari.com/assets/tari-logo.png'],
};

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, sepolia];

const baseAdapterConfig = {
    networks,
    ssr: typeof window === 'undefined',
};

export const useWagmiAdapter = () => {
    const [projectId, setProjectId] = useState<string | undefined>(undefined);
    const [initializedAdapter, setInitializedAdapter] = useState<WagmiAdapter | undefined>(undefined);
    const [isInitializing, setIsInitializing] = useState<boolean>(false);

    useEffect(() => {
        const fetchProjectId = async () => {
            console.info('Attempting to fetch project ID...');
            let appInMemoryConfig: ConfigBackendInMemory | undefined = useConfigBEInMemoryStore.getState();

            if (!appInMemoryConfig?.walletConnectProjectId) {
                console.info('Project ID not in memory store, invoking backend...');
                try {
                    appInMemoryConfig = await invoke<ConfigBackendInMemory>('get_app_in_memory_config', {});
                } catch (e) {
                    console.error(`get_app_in_memory_config error: ${e}`);
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

    useEffect(() => {
        if (projectId && !isInitializing && !initializedAdapter) {
            setIsInitializing(true);
            console.info(`Initializing AppKit with Project ID: ${projectId}`);

            const wagmiAdapterInstance = new WagmiAdapter({
                ...baseAdapterConfig,
                projectId,
            });

            createAppKit({
                adapters: [wagmiAdapterInstance],
                networks,
                projectId,
                metadata,
                features: {
                    analytics: true,
                },
            });

            console.info('AppKit initialized, setting adapter.');
            setInitializedAdapter(wagmiAdapterInstance);
            setIsInitializing(false);
        } else if (projectId === '' && !isInitializing && !initializedAdapter) {
            console.warn('Project ID is empty, AppKit/WagmiAdapter not initialized.');
            setIsInitializing(false);
        }
    }, [projectId, initializedAdapter, isInitializing]); // Dependencies for this effect

    return initializedAdapter;
};

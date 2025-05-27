// File: @app/hooks/swap/useWagmiAdapter.ts
import { createAppKit } from '@reown/appkit/react';
import { AppKitNetwork, mainnet, sepolia } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'; // Ensure this is compatible with your Wagmi version
import { ConfigBackendInMemory } from '@app/types/configs'; // Assuming this type is correct
import { useConfigBEInMemoryStore } from '@app/store';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

// These are fine as constants outside the hook
const metadata = {
    name: 'TariUniverse',
    description: 'Tari Universe Wallet',
    url: 'https://universe.tari.com',
    icons: ['https://universe.tari.com/assets/tari-logo.png'],
};

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, sepolia];

// Base config for the adapter, projectId will be overridden
const baseAdapterConfig = {
    networks, // This might be projectId-dependent or AppKit handles network definition separately
    ssr: typeof window === 'undefined', // Better SSR check
};

export const useWagmiAdapter = () => {
    const [projectId, setProjectId] = useState<string | undefined>(undefined);
    const [initializedAdapter, setInitializedAdapter] = useState<WagmiAdapter | undefined>(undefined);
    const [isInitializing, setIsInitializing] = useState<boolean>(false);

    // Effect to fetch the projectId
    useEffect(() => {
        const fetchProjectId = async () => {
            console.info('Attempting to fetch project ID...');
            // Prefer checking the store synchronously first if it might already have the value
            let appInMemoryConfig: ConfigBackendInMemory | undefined = useConfigBEInMemoryStore.getState();

            if (!appInMemoryConfig?.walletConnectProjectId) {
                console.info('Project ID not in memory store, invoking backend...');
                try {
                    // Ensure the type from invoke matches ConfigBackendInMemory or handle appropriately
                    appInMemoryConfig = await invoke<ConfigBackendInMemory>('get_app_in_memory_config', {});
                    // If your Zustand store needs updating after fetch, do it here:
                    // useConfigBEInMemoryStore.setState({ config: appInMemoryConfig });
                } catch (e) {
                    console.error(`get_app_in_memory_config error: ${e}`);
                    setProjectId(''); // Set to empty string or handle error state
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
    }, []); // Runs once on component mount

    // Effect to initialize AppKit and the adapter once projectId is available
    useEffect(() => {
        // Only proceed if projectId is fetched, not an empty string, and not already initializing/initialized
        if (projectId && !isInitializing && !initializedAdapter) {
            setIsInitializing(true);
            console.info(`Initializing AppKit with Project ID: ${projectId}`);

            // Create the adapter instance
            const wagmiAdapterInstance = new WagmiAdapter({
                ...baseAdapterConfig, // Spread your base config
                projectId, // Crucially, use the fetched projectId
            });

            // Initialize AppKit - this is a side effect
            // This call should set up WalletConnect connectors internally
            createAppKit({
                adapters: [wagmiAdapterInstance],
                networks, // Pass your defined networks
                projectId, // Pass the projectId to AppKit as well
                metadata,
                features: {
                    analytics: true, // Example feature
                    // Add other AppKit features as needed
                },
            });

            console.info('AppKit initialized, setting adapter.');
            // Now that AppKit is initialized (and by extension WalletConnect through the adapter),
            // set the adapter state. This will make wagmiAdapterInstance.wagmiConfig available.
            setInitializedAdapter(wagmiAdapterInstance);
            setIsInitializing(false);
        } else if (projectId === '' && !isInitializing && !initializedAdapter) {
            // Handle the case where projectId resolved to an empty string (error or no ID)
            // You might want to set a specific error state or return a null adapter
            console.warn('Project ID is empty, AppKit/WagmiAdapter not initialized.');
            // setInitializedAdapter(undefined); // Or some placeholder if needed
            setIsInitializing(false);
        }
    }, [projectId, initializedAdapter, isInitializing]); // Dependencies for this effect

    // Return the adapter instance. The consuming component will use its .wagmiConfig
    return initializedAdapter;
};

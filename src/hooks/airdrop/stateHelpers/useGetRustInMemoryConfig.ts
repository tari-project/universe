import * as Sentry from '@sentry/react';
import { BackendInMemoryConfig, useAirdropStore } from '@app/store/useAirdropStore';
import { invoke } from '@tauri-apps/api/core';
import { useEffect } from 'react';

export function useGetRustInMemoryConfig() {
    const { setBackendInMemoryConfig } = useAirdropStore();

    useEffect(() => {
        invoke('get_app_in_memory_config', {})
            .then((result) => {
                setBackendInMemoryConfig(result as BackendInMemoryConfig);
            })
            .catch((e) => {
                Sentry.captureException(e);
                console.error('get_app_in_memory_config error:', e);
            });
    }, [setBackendInMemoryConfig]);
}

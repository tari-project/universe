import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from '../../types.ts';
import {
    fetchApplicationsVersionsWithRetry,
    setSetupComplete,
    setSetupParams,
    setSetupProgress,
    setSetupTitle,
} from '@app/store/actions';

export function useSetUp() {
    useEffect(() => {
        const unlistenPromise = listen('setup_message', async ({ event: e, payload: p }: TauriEvent) => {
            console.info('Received tauri event: ', { e, p });
            switch (p.event_type) {
                case 'setup_status':
                    if (p.progress > 0) {
                        setSetupTitle(p.title);
                        setSetupParams(p.title_params);
                        setSetupProgress(p.progress);
                    }
                    if (p.progress >= 1) {
                        await setSetupComplete();
                        await fetchApplicationsVersionsWithRetry();
                    }
                    break;
                default:
                    console.warn('Unknown tauri event: ', { e, p });
                    break;
            }
        });

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, []);
}

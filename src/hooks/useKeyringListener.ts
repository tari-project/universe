import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from '@app/types.ts';

export default function useKeyringListener() {
    useEffect(() => {
        const promise = listen('keyring_message', ({ event, payload }: TauriEvent) => {
            if (payload.event_type === 'keyring_previously_used') {
                console.debug('========================================');
                console.debug('OI!!');
                console.debug(payload);
                console.debug(event);
                console.debug('========================================');
            }
        });

        return () => {
            promise.then((ul) => ul());
        };
    }, []);
}

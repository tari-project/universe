import { setXSpaceEvent } from '@app/store/actions/airdropStoreActions';
import { WebsocketEventNames, WebsocketGlobalEvent } from '@app/types/ws';
import { useCallback } from 'react';

export const useHandleWsGlobalEvent = () => {
    return useCallback((event: WebsocketGlobalEvent) => {
        switch (event.name) {
            case WebsocketEventNames.X_SPACE_EVENT:
                setXSpaceEvent(event.data);
                break;
            default:
                console.warn('Unknown global event', event);
        }
    }, []);
};

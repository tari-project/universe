import { setXSpaceEvent } from '@app/store/actions/airdropStoreActions';
import { WebsocketEventNames, WebsocketGlobalEvent } from '@app/types/ws';
import { useCallback } from 'react';

export const useHandleWsGlobalEvent = () => {
    return useCallback((event: string) => {
        const eventParsed = JSON.parse(event) as WebsocketGlobalEvent;
        switch (eventParsed.name) {
            case WebsocketEventNames.X_SPACE_EVENT:
                setXSpaceEvent(eventParsed.data);
                break;
            default:
                console.warn('Unknown global event', eventParsed);
        }
    }, []);
};

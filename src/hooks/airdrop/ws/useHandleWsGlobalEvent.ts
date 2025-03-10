import { useAirdropStore } from '@app/store/useAirdropStore';
import { WebsocketEventNames, WebsocketGlobalEvent } from '@app/types/ws';

export const useHandleWsGlobalEvent = () => {
    const setLatestXSpaceEvent = useAirdropStore((state) => state.setLatestXSpaceEvent);

    return (event: string) => {
        const eventParsed = JSON.parse(event) as WebsocketGlobalEvent;
        switch (eventParsed.name) {
            case WebsocketEventNames.X_SPACE_EVENT:
                setLatestXSpaceEvent(eventParsed.data);
                break;
            default:
                // eslint-disable-next-line no-console
                console.log('Unknown global event', eventParsed);
        }
    };
};

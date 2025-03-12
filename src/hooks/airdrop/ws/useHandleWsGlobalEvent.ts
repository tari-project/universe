import { useAirdropStore } from '@app/store/useAirdropStore';
import { WebsocketEventNames, WebsocketGlobalEvent } from '@app/types/ws';

export const useHandleWsGlobalEvent = () => {
    return (event: string) => {
        const eventParsed = JSON.parse(event) as WebsocketGlobalEvent;
        switch (eventParsed.name) {
            case WebsocketEventNames.X_SPACE_EVENT:
                useAirdropStore.setState({ latestXSpaceEvent: eventParsed.data });
                break;
            default:
                // eslint-disable-next-line no-console
                console.log('Unknown global event', eventParsed);
        }
    };
};

import { WebsocketEventNames, WebsocketUserEvent } from '@app/types/ws';
import { setFlareAnimationType, setUserPoints } from '@app/store';
import { useCallback } from 'react';
import { setLatestXSpaceEvent } from '@app/store/actions/airdropStoreActions.ts';

export function useHandleWsUserIdEvent() {
    return useCallback((event: string) => {
        const eventParsed = JSON.parse(event) as WebsocketUserEvent;
        switch (eventParsed.name) {
            case WebsocketEventNames.REFERRAL_INSTALL_REWARD:
                setFlareAnimationType('FriendAccepted');
                break;
            case WebsocketEventNames.USER_SCORE_UPDATE:
                if (eventParsed.data.userPoints) {
                    setUserPoints({
                        base: eventParsed.data.userPoints,
                    });
                }
                break;
            case WebsocketEventNames.COMPLETED_QUEST:
                if (eventParsed.data.userPoints) {
                    setUserPoints({
                        base: eventParsed.data.userPoints,
                    });
                }
                break;
            case WebsocketEventNames.X_SPACE_EVENT:
                setLatestXSpaceEvent(eventParsed.data);
                break;
            default:
                console.warn('Unknown event', eventParsed);
        }
    }, []);
}

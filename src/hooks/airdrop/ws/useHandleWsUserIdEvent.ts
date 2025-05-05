import { WebsocketEventNames, WebsocketUserEvent } from '@app/types/ws';
import { setFlareAnimationType, setUserPoints } from '@app/store';
import { useCallback } from 'react';
import { setLatestXSpaceEvent } from '@app/store/actions/airdropStoreActions.ts';

export function useHandleWsUserIdEvent() {
    return useCallback((event: WebsocketUserEvent) => {
        switch (event.name) {
            case WebsocketEventNames.REFERRAL_INSTALL_REWARD:
                setFlareAnimationType('FriendAccepted');
                break;
            case WebsocketEventNames.USER_SCORE_UPDATE:
                if (event.data.userPoints) {
                    setUserPoints({
                        base: event.data.userPoints,
                    });
                }
                break;
            case WebsocketEventNames.COMPLETED_QUEST:
                if (event.data.userPoints) {
                    setUserPoints({
                        base: event.data.userPoints,
                    });
                }
                break;
            case WebsocketEventNames.X_SPACE_EVENT:
                setLatestXSpaceEvent(event.data);
                break;
            default:
                console.warn('Unknown event', event);
        }
    }, []);
}

import { useAirdropStore } from '@app/store/useAirdropStore';
import { useShellOfSecretsStore } from '@app/store/useShellOfSecretsStore';
import { WebsocketEventNames, WebsocketUserEvent } from '@app/types/ws';
import { useGetSosReferrals } from '../stateHelpers/useGetSosReferrals';

export const useHandleWsUserIdEvent = () => {
    const setTotalBonusTimeMs = useShellOfSecretsStore((state) => state.setTotalBonusTimeMs);
    const setUserGems = useAirdropStore((state) => state.setUserGems);
    const { handleFetchUserDetails } = useGetSosReferrals();

    return (event: string) => {
        const eventParsed = JSON.parse(event) as WebsocketUserEvent;
        switch (eventParsed.name) {
            case WebsocketEventNames.COMPLETED_QUEST:
                if (eventParsed.data.userPoints?.gems) {
                    setUserGems(eventParsed.data.userPoints?.gems);
                }
                break;
            case WebsocketEventNames.MINING_STATUS_CREW_UPDATE:
                setTotalBonusTimeMs(eventParsed.data.totalTimeBonusMs);
                break;
            case WebsocketEventNames.MINING_STATUS_CREW_DISCONNECTED:
                handleFetchUserDetails();
                break;
            case WebsocketEventNames.MINING_STATUS_USER_UPDATE:
                setTotalBonusTimeMs(eventParsed.data.totalTimeBonusMs);
                break;
            default:
                // eslint-disable-next-line no-console
                console.log('Unknown event', eventParsed);
        }
    };
};

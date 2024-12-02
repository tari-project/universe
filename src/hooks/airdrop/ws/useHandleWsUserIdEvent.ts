import { useAirdropStore } from '@app/store/useAirdropStore';
import { useShellOfSecretsStore } from '@app/store/useShellOfSecretsStore';
import { WebsocketEventNames, WebsocketUserEvent } from '@app/types/ws';

export const useHandleWsUserIdEvent = () => {
    const setTotalBonusTimeMs = useShellOfSecretsStore((state) => state.setTotalBonusTimeMs);
    const referrals = useShellOfSecretsStore((state) => state.referrals);
    const setReferrals = useShellOfSecretsStore((state) => state.setReferrals);
    const setUserGems = useAirdropStore((state) => state.setUserGems);

    return (event: string) => {
        const eventParsed = JSON.parse(event) as WebsocketUserEvent;
        switch (eventParsed.name) {
            case WebsocketEventNames.COMPLETED_QUEST:
                if (eventParsed.data.userPoints?.gems) {
                    setUserGems(eventParsed.data.userPoints?.gems);
                }
                break;
            case WebsocketEventNames.MINING_STATUS_CREW_UPDATE: {
                if ((referrals?.activeReferrals?.length || 0) < 15) {
                    const existingReferral = referrals?.activeReferrals?.find(
                        (x) => x.id === eventParsed.data.crewMember.id
                    );

                    if (!existingReferral && referrals) {
                        const newActiveReferrals = [...(referrals?.activeReferrals || []), eventParsed.data.crewMember];
                        setReferrals({
                            ...referrals,
                            activeReferrals: newActiveReferrals,
                        });
                    }
                }
                setTotalBonusTimeMs(eventParsed.data.totalTimeBonusMs);
                break;
            }
            case WebsocketEventNames.MINING_STATUS_CREW_DISCONNECTED:
                if (referrals?.activeReferrals) {
                    const referralsUpdated = referrals?.activeReferrals.filter(
                        (x) => x.id !== eventParsed.data.crewMemberId
                    );

                    setReferrals({
                        ...referrals,
                        activeReferrals: referralsUpdated,
                    });
                }
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

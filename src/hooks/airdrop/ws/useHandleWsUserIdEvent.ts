import { useShellOfSecretsStore } from '@app/store/useShellOfSecretsStore';
import { WebsocketEventNames, WebsocketUserEvent } from '@app/types/ws';
import { useGetSosReferrals } from '../stateHelpers/useGetSosReferrals';
import { setFlareAnimationType, setUserGems } from '@app/store';

export const useHandleWsUserIdEvent = () => {
    const setTotalBonusTimeMs = useShellOfSecretsStore((state) => state.setTotalBonusTimeMs);
    const referrals = useShellOfSecretsStore((state) => state.referrals);
    const setReferrals = useShellOfSecretsStore((state) => state.setReferrals);
    const fetchCrewMemberDetails = useGetSosReferrals();

    return (event: string) => {
        const eventParsed = JSON.parse(event) as WebsocketUserEvent;
        switch (eventParsed.name) {
            case WebsocketEventNames.REFERRAL_INSTALL_REWARD:
                setFlareAnimationType('FriendAccepted');
                break;
            case WebsocketEventNames.USER_SCORE_UPDATE:
                if (eventParsed.data.userPoints?.gems) {
                    setUserGems(eventParsed.data.userPoints.gems);
                }
                break;
            case WebsocketEventNames.COMPLETED_QUEST:
                if (eventParsed.data.userPoints?.gems) {
                    setUserGems(eventParsed.data.userPoints.gems);
                }
                break;
            case WebsocketEventNames.MINING_STATUS_CREW_UPDATE: {
                fetchCrewMemberDetails(eventParsed.data.crewMember.id);
                setTotalBonusTimeMs(eventParsed.data.totalTimeBonusMs);
                break;
            }

            case WebsocketEventNames.MINING_STATUS_CREW_DISCONNECTED:
                if (referrals?.activeReferrals) {
                    const totalActiveReferrals = (referrals?.totalActiveReferrals || 1) - 1;
                    const referralsUpdated = referrals?.activeReferrals.map((x) => {
                        if (x.id === eventParsed.data.crewMemberId) {
                            return { ...x, active: false };
                        }
                        return x;
                    });

                    setReferrals({
                        ...referrals,
                        totalActiveReferrals,
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

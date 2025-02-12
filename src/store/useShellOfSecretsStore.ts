import { CrewMember } from '@app/types/ws.ts';
import { create } from './create.ts';

const SOS_GAME_ENDING_DATE = new Date('2025-01-30');
export const MINING_EVENT_INTERVAL_MS = 15000;

// Type for the response structure
export interface ReferralsResponse {
    activeReferrals: CrewMember[];
    totalActiveReferrals: number;
    totalReferrals: number;
    toleranceMs: number;
}

type WsConnectionStateString = 'up' | 'off' | 'error';

export interface WsConnectionEvent {
    state: WsConnectionStateString;
    error?: string;
}

interface WsConnectionState {
    state: WsConnectionStateString;
    error?: {
        since: Date;
        timeDownMs: number;
        lastMessage: string;
    };
}

interface State {
    referrals?: ReferralsResponse;
    showWidget: boolean;
    totalBonusTimeMs: number;
    revealDate: Date;
    wsConnectionState: WsConnectionState;
}

interface Actions {
    setReferrals: (referrals: ReferralsResponse) => void;
    setShowWidget: (showWidget: boolean) => void;
    setTotalBonusTimeMs: (totalTimeBonusUpdate: number) => void;
    registerWsConnectionEvent: (event: WsConnectionEvent) => void;
}

const initialState: State = {
    referrals: undefined,
    showWidget: false,
    totalBonusTimeMs: 0,
    revealDate: SOS_GAME_ENDING_DATE,
    wsConnectionState: {
        state: 'off',
    },
};

export const useShellOfSecretsStore = create<State & Actions>()((set) => ({
    ...initialState,
    setReferrals: (referrals) => set({ referrals }),
    setShowWidget: (showWidget) => set({ showWidget }),
    setTotalBonusTimeMs: (totalTimeBonusUpdate: number) => set({ totalBonusTimeMs: totalTimeBonusUpdate }),
    registerWsConnectionEvent: (event: WsConnectionEvent) =>
        set(({ wsConnectionState }) => {
            if (event.state === 'off' || event.state === 'up') {
                return { wsConnectionState: { state: event.state }, error: undefined };
            }

            const currentTime = new Date();

            //in case an error happened
            if (event.state === 'error') {
                return {
                    wsConnectionState: {
                        state: event.state,
                        error: {
                            since: wsConnectionState.error?.since ?? new Date(),
                            timeDownMs:
                                currentTime.getTime() -
                                (wsConnectionState.error?.since.getTime() || currentTime.getTime()),
                            lastMessage: event?.error || '',
                        },
                    },
                };
            }
            return { wsConnectionState };
        }),
}));

export const getSOSTimeRemaining = () => {
    const now = new Date();
    const targetDateBroughtForwardByTimeBonus =
        useShellOfSecretsStore.getState().revealDate.getTime() - useShellOfSecretsStore.getState().totalBonusTimeMs;
    const remainingMs = targetDateBroughtForwardByTimeBonus - now.getTime();

    const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days, hours, totalRemainingMs: remainingMs };
};

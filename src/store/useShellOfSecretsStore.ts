import { CrewMember } from '@app/types/ws.ts';
import { create } from './create.ts';
import { AwardedTimeBonus } from '@app/types/sosTypes.ts';

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
    showMainModal: boolean;
    wsConnectionState: WsConnectionState;
}

interface Actions {
    setReferrals: (referrals: ReferralsResponse) => void;
    setShowWidget: (showWidget: boolean) => void;
    setTotalBonusTimeMs: (totalTimeBonusUpdate: number) => void;
    setTotalTimeBonus: (totalTimeBonusUpdate: AwardedTimeBonus) => void;
    getTimeRemaining: () => { days: number; hours: number; totalRemainingMs: number; minutes: number; seconds: number };
    setShowMainModal: (showMainModal: boolean) => void;
    registerWsConnectionEvent: (event: WsConnectionEvent) => void;
}

const initialState: State = {
    referrals: undefined,
    showWidget: false,
    totalBonusTimeMs: 0,
    revealDate: SOS_GAME_ENDING_DATE,
    showMainModal: false,
    wsConnectionState: {
        state: 'off',
    },
};

export const useShellOfSecretsStore = create<State & Actions>()((set, get) => ({
    ...initialState,
    setReferrals: (referrals) => set({ referrals }),
    setShowWidget: (showWidget) => set({ showWidget }),
    setTotalBonusTimeMs: (totalTimeBonusUpdate: number) => set({ totalBonusTimeMs: totalTimeBonusUpdate }),
    setTotalTimeBonus: (totalTimeBonusUpdate: AwardedTimeBonus) => {
        let newTotalTimeBonus = 0;
        if (totalTimeBonusUpdate.days) {
            newTotalTimeBonus += totalTimeBonusUpdate.days * 24 * 60 * 60 * 1000;
        }
        if (totalTimeBonusUpdate.hours) {
            newTotalTimeBonus += totalTimeBonusUpdate.hours * 60 * 60 * 1000;
        }
        if (totalTimeBonusUpdate.minutes) {
            newTotalTimeBonus += totalTimeBonusUpdate.minutes * 60 * 1000;
        }
        if (totalTimeBonusUpdate.seconds) {
            newTotalTimeBonus += totalTimeBonusUpdate.seconds * 1000;
        }
        if (newTotalTimeBonus !== get().totalBonusTimeMs) {
            set({ totalBonusTimeMs: newTotalTimeBonus });
        }
    },
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
    getTimeRemaining: () => {
        const now = new Date();
        const targetDateBroughtForwardByTimeBonus = get().revealDate.getTime() - get().totalBonusTimeMs;
        const remainingMs = targetDateBroughtForwardByTimeBonus - now.getTime();

        const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
        return { days, hours, totalRemainingMs: remainingMs, minutes, seconds };
    },
    setShowMainModal: (showMainModal) => set({ showMainModal }),
}));

import { CrewMember } from '@app/types/ws.ts';
import { create } from './create.ts';

const SOS_GAME_ENDING_DATE = new Date('2025-01-30');

// Type for the response structure
export interface ReferralsResponse {
    activeReferrals: CrewMember[];
    totalActiveReferrals: number;
    totalReferrals: number;
    toleranceMs: number;
}

interface State {
    referrals?: ReferralsResponse;
    showWidget: boolean;
    totalBonusTimeMs: number;
    revealDate: Date;
    showMainModal: boolean;
}

interface Actions {
    setReferrals: (referrals: ReferralsResponse) => void;
    setShowWidget: (showWidget: boolean) => void;
    setTotalBonusTimeMs: (totalTimeBonusUpdate: number) => void;
    getTimeRemaining: () => { days: number; hours: number; totalRemainingMs: number };
    setShowMainModal: (showMainModal: boolean) => void;
}

const initialState: State = {
    referrals: undefined,
    showWidget: false,
    totalBonusTimeMs: 0,
    revealDate: SOS_GAME_ENDING_DATE,
    showMainModal: false,
};

export const useShellOfSecretsStore = create<State & Actions>()((set, get) => ({
    ...initialState,
    setReferrals: (referrals) => set({ referrals }),
    setShowWidget: (showWidget) => set({ showWidget }),
    setTotalBonusTimeMs: (totalTimeBonusUpdate: number) => set({ totalBonusTimeMs: totalTimeBonusUpdate }),
    getTimeRemaining: () => {
        const now = new Date();
        const targetDateBroughtForwardByTimeBonus = get().revealDate.getTime() - get().totalBonusTimeMs;
        const remainingMs = targetDateBroughtForwardByTimeBonus - now.getTime();

        const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return { days, hours, totalRemainingMs: remainingMs };
    },
    setShowMainModal: (showMainModal) => set({ showMainModal }),
}));

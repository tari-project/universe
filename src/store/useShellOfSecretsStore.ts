import { create } from './create.ts';

const SOS_GAME_ENDING_DATE = new Date('2025-01-30');

// Type for each referral in activeReferrals
export interface CrewMember {
    imageUrl: string | null; // assuming image_url can be null
    id: string; // assuming user.id is a string
    name: string;
    profileImageUrl: string | null; // assuming profileImageUrl can be null
    lastHandshakeAt: Date | null; // assuming lastHandshakeAt can be null
}

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
}

interface Actions {
    setReferrals: (referrals: ReferralsResponse) => void;
    setShowWidget: (showWidget: boolean) => void;
    setTotalBonusTimeMs: (totalTimeBonusUpdate: number) => void;
    getTimeRemaining: () => { days: number; hours: number; totalRemainingMs: number };
}

const initialState: State = {
    referrals: undefined,
    showWidget: false,
    totalBonusTimeMs: 0,
    revealDate: SOS_GAME_ENDING_DATE,
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
}));

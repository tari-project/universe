import { create } from './create.ts';

const SOS_GAME_ENDING_DATE = new Date('2025-01-30');

interface State {
    showWidget: boolean;
    totalBonusTimeMs: number;
    revealDate: Date;
}

interface Actions {
    setShowWidget: (showWidget: boolean) => void;
    setTotalBonusTimeMs: (totalTimeBonusUpdate: number) => void;
    getTimeRemaining: () => { days: number; hours: number; totalRemainingMs: number };
}

const initialState: State = {
    showWidget: false,
    totalBonusTimeMs: 0,
    revealDate: SOS_GAME_ENDING_DATE,
};

export const useShellOfSecretsStore = create<State & Actions>()((set, get) => ({
    ...initialState,
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

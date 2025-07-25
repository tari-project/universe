import { create } from './create.ts';

interface State {
    showWidget: boolean;
    isOpen: boolean;
    streakDays: number;
    totalFriends: number;
    activeFriends: number;
    bonusXTMEarned: number;
}

interface Actions {
    setShowWidget: (showWidget: boolean) => void;
    setIsOpen: (isOpen: boolean) => void;
    setStreakDays: (streakDays: number) => void;
    setTotalFriends: (totalFriends: number) => void;
    setActiveFriends: (activeFriends: number) => void;
    setBonusXTMEarned: (bonusXTMEarned: number) => void;
}

const initialState: State = {
    showWidget: false,
    isOpen: false,
    streakDays: 2,
    totalFriends: 38,
    activeFriends: 12,
    bonusXTMEarned: 15000000000,
};

export const useCrewRewardsStore = create<State & Actions>()((set) => ({
    ...initialState,
    setShowWidget: (showWidget) => set({ showWidget }),
    setIsOpen: (isOpen) => set({ isOpen }),
    setStreakDays: (streakDays) => set({ streakDays }),
    setTotalFriends: (totalFriends) => set({ totalFriends }),
    setActiveFriends: (activeFriends) => set({ activeFriends }),
    setBonusXTMEarned: (bonusXTMEarned) => set({ bonusXTMEarned }),
}));

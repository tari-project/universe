import { create } from 'zustand';

interface AirdropState {
    authUuid: string;
}

interface AirdropStore extends AirdropState {
    setAuthUuid: (authUuid: string) => void;
}

export const useAirdropStore= create<AirdropStore>()((set) => ({
    authUuid: '',
    setAuthUuid: (authUuid) => set({ authUuid }),
}));


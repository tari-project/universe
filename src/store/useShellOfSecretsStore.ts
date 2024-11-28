import { create } from './create.ts';

interface State {
    showWidget: boolean;
}

interface Actions {
    setShowWidget: (showWidget: boolean) => void;
}

const initialState: State = {
    showWidget: false,
};

export const useShellOfSecretsStore = create<State & Actions>()((set) => ({
    ...initialState,
    setShowWidget: (showWidget) => set({ showWidget }),
}));

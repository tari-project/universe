import { create } from 'zustand';
import { AppStatus } from '../types/app-status.ts';

type State = AppStatus;
interface Actions {
    setAppStatus: (appStatus: AppStatus) => void;
}
type AppStatusStoreState = State & Actions;

const initialState: State = {
    cpu: undefined,
    base_node: undefined,
    wallet_balance: undefined,
};
export const useAppStatusStore = create<AppStatusStoreState>()((set) => ({
    ...initialState,
    setAppStatus: (appStatus) => set({ ...appStatus }),
}));

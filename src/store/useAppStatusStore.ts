import { create } from 'zustand';
import { AppStatus } from '../types/app-status.ts';
import { modeType } from './types.ts';
import { persist } from 'zustand/middleware';

interface State extends AppStatus {
    mode: modeType;
}
interface Actions {
    setAppStatus: (appStatus: AppStatus) => void;
    setMode: (mode: modeType) => void;
}
type AppStatusStoreState = State & Actions;

const initialState: State = {
    cpu: undefined,
    base_node: undefined,
    wallet_balance: undefined,
    mode: 'eco',
    gpu_brand: undefined,
};
export const useAppStatusStore = create<AppStatusStoreState>()(
    persist(
        (set) => ({
            ...initialState,
            setAppStatus: (appStatus) => set({ ...appStatus }),
            setMode: (mode) => set({ mode }),
        }),
        { name: 'status-store' }
    )
);

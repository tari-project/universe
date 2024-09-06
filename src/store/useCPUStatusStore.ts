import { create } from 'zustand';
import { CpuMinerStatus } from '../types/app-status.ts';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Actions {
    setCPUStatus: (cpuStatus?: CpuMinerStatus) => void;
}
type CPUStatusStoreState = CpuMinerStatus & Actions;

const initialState: CpuMinerStatus = {
    is_mining: false,
    hash_rate: 0,
    estimated_earnings: 0,
    connection: { is_connected: false },
};
export const useCPUStatusStore = create<CPUStatusStoreState>()(
    persist(
        (set) => ({
            ...initialState,
            setCPUStatus: (cpuStatus) => set({ ...cpuStatus }),
        }),
        {
            name: 'cpu',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);

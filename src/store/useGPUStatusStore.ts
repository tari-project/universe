import { create } from 'zustand';
import { GpuMinerStatus } from '../types/app-status.ts';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Actions {
    setGPUStatus: (gpuStatus?: GpuMinerStatus) => void;
}
type GPUStatusStoreState = GpuMinerStatus & Actions;

const initialState: GpuMinerStatus = {
    gpu_hash_rate: 0,
    gpu_estimated_earnings: 0,
};
export const useGPUStatusStore = create<GPUStatusStoreState>()(
    persist(
        (set) => ({
            ...initialState,
            setGPUStatus: (gpuStatus) => set({ ...gpuStatus }),
        }),
        {
            name: 'gpu',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (s) => ({
                gpu_hash_rate: s.gpu_hash_rate,
            }),
        }
    )
);

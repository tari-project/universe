import { create } from './create';
import { GpuMinerStatus } from '../types/app-status.ts';

interface Actions {
    setGPUStatus: (gpuStatus?: GpuMinerStatus) => void;
}
type GPUStatusStoreState = GpuMinerStatus & Actions;

const initialState: GpuMinerStatus = {
    is_mining: false,
    hash_rate: 0,
    estimated_earnings: 0,
};
export const useGPUStatusStore = create<GPUStatusStoreState>()((set) => ({
    ...initialState,
    setGPUStatus: (gpuStatus) => set({ ...gpuStatus }),
}));

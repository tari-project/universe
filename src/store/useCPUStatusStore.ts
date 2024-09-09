import { create } from './create';
import { CpuMinerStatus } from '../types/app-status.ts';

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
export const useCPUStatusStore = create<CPUStatusStoreState>()((set) => ({
    ...initialState,
    setCPUStatus: (cpuStatus) => set({ ...cpuStatus }),
}));

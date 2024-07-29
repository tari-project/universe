import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { viewType, backgroundType } from './types';

interface AppState {
  background: backgroundType;
  setBackground: (value: backgroundType) => void;
  view: viewType;
  setView: (value: viewType) => void;
  visualMode: boolean;
  setVisualMode: (value: boolean) => void;
  wallet: {
    balance: number;
  };
  setWallet: (value: { balance: number }) => void;
  isMining : boolean,
  setIsMining: (value: boolean) => void;
  cpuUsage: number;
  setCpuUsage: (value: number) => void;
  hashRate: number;
  setHashRate: (value: number) => void;
  startMining: () => Promise<void>;
  stopMining: () => Promise<void>;
}

const useAppStateStore = create<AppState>((set) => ({
  background: 'idle',
  setBackground: (value) => set({ background: value }),
  view: 'mining',
  setView: (value) => set({ view: value }),
  visualMode: true,
  setVisualMode: (value) => set({ visualMode: value }),
  wallet: {
    balance: 0,
  },
  setWallet: (value) => set({ wallet: value }),
    isMining: false,
    setIsMining: (value) => set({ isMining: value }),
    cpuUsage: 0,
    setCpuUsage: (value) => set({ cpuUsage: value }),
    hashRate: 0,
    setHashRate: (value) => set({ hashRate: value }),
  startMining: async () => {
    try {
      await invoke('start_mining', {});
      console.log('Mining started');
    } catch (e) {
      console.error('Could not start mining', e);
    }
  },
  stopMining: async () => {
    try {
      await invoke('stop_mining', {});
      console.log('Mining stopped');
    } catch (e) {
      console.error('Could not stop mining', e);
    }
  },
}));

export default useAppStateStore;

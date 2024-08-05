import {create} from 'zustand';
import {invoke} from '@tauri-apps/api/tauri';
import {viewType, backgroundType, modeType} from './types';

interface AppState {
  appState: any;
  setAppState: (value: any) => void;
  error: string;
  setError: (value: string) => void;
  topStatus: string;
  setTopStatus: (value: string) => void;
  errorOpen: boolean;
  setErrorOpen: (value: boolean) => void;
  setupTitle: string;
  setupProgress: number;
  setSetupDetails: (setupTitle: string, setupProgress: number) => void;

  // gui
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
  isMining: boolean;
  setIsMining: (value: boolean) => void;
  isAutoMining: boolean;
  setIsAutoMining: (value: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  isSettingUp: boolean;

  // stats
  cpuUsage: number;
  setCpuUsage: (value: number) => void;
  mode: modeType;
  setMode: (value: modeType) => void;
  hashRate: number;
  setHashRate: (value: number) => void;
  cpuBrand: string,
  setCpuBrand: (value: string) => void;
  estimatedEarnings: number,
  setEstimatedEarnings: (value: number) => void;

  blockHeight: number,
  setBlockHeight: (value: number) => void;
  blockTime: number,
  setBlockTime: (value: number) => void;
  isSynced: boolean,
  setIsSynced: (value: boolean) => void;
  // functions
  startMining: () => Promise<void>;
  stopMining: () => Promise<void>;
  settingUpFinished: () => Promise<void>;
}

const useAppStateStore = create<AppState>((set) => ({
  appState: {},
  setAppState: (value) => set({appState: value}),
  error: '',
  setError: (value) => set({error: value}),
  topStatus: 'Not mining',
  setTopStatus: (value) => set({topStatus: value}),
  errorOpen: false,
  setErrorOpen: (value) => set({errorOpen: value}),

  // gui
  background: 'loading',
  setBackground: (value) => set({ background: value }),
  view: 'setup',
  setView: (value) => set({ view: value }),
  visualMode: true,
  setVisualMode: (value) => set({ visualMode: value }),
  wallet: {
    balance: 0,
  },
  setWallet: (value) => set({ wallet: value }),
  isMining: false,
  setIsMining: (value) => set({ isMining: value }),
  isAutoMining: false,
  setIsAutoMining: (value) => set({ isAutoMining: value }),
  sidebarOpen: false,
  setSidebarOpen: (value) => set({ sidebarOpen: value }),
  isSettingUp: true,
  setupTitle: "",
  setupProgress: 0,
  setSetupDetails: (setupTitle: string, setupProgress: number) => set({ setupTitle, setupProgress }),

  // stats
  cpuUsage: 0,
  setCpuUsage: (value) => set({cpuUsage: value}),
  mode: 'eco',
  setMode: (value) => set({mode: value}),
  hashRate: 0,
  setHashRate: (value) => set({hashRate: value}),
  cpuBrand: '',
  setCpuBrand: (value) => set({cpuBrand: value}),
  estimatedEarnings: 0,
  setEstimatedEarnings: (value) => set({estimatedEarnings: value}),

  blockHeight: 0,
  setBlockHeight: (value) => set({ blockHeight: value }),
  blockTime: 0,
  setBlockTime: (value) => set({ blockTime: value }),
  isSynced: false,
  setIsSynced: (value) => set({ isSynced: value }),

  // functions
  settingUpFinished: async () => {
    set({
      isSettingUp: false,
      view: "mining",
      background: "idle"
    });
  },

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

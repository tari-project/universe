import { create } from 'zustand';

interface WalletStore {
    //   wallet: {
    //     balance: number;
    //   };
    //   setWallet: (value: { balance: number }) => void;
    balance: number;
    setBalance: (value: number) => void;
}

const useWalletStore = create<WalletStore>()((set) => ({
    //   wallet: {
    //     balance: 0,
    //   },
    //   setWallet: (value) => set({ wallet: value }),
    balance: 0,
    setBalance: (value) => set({ balance: value }),
}));

export default useWalletStore;

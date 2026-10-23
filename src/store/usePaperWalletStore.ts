import { create } from 'zustand';

// Sync with phone is off in this build (as PAPER_WALLET_ENABLED in the backend's commands):
// under tari 6.3 it exports a version 3 seed the current Aurora app can't read yet.
export const PAPER_WALLET_ENABLED = false;

interface State {
    showModal: boolean;
    qrCodeValue: string;
    identificationCode: string;
}

interface Actions {
    setShowModal: (showModal: boolean) => void;
    setQrCodeValue: (qrCodeValue: string) => void;
    setIdentificationCode: (identificationCode: string) => void;
}

const initialState: State = {
    showModal: false,
    qrCodeValue: '',
    identificationCode: '',
};

export const usePaperWalletStore = create<State & Actions>()((set) => ({
    ...initialState,
    setShowModal: (showModal) => set({ showModal: showModal && PAPER_WALLET_ENABLED }),
    setQrCodeValue: (qrCodeValue) => set({ qrCodeValue }),
    setIdentificationCode: (identificationCode) => set({ identificationCode }),
}));

import { create } from './create.ts';

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
    setShowModal: (showModal) => set({ showModal }),
    setQrCodeValue: (qrCodeValue) => set({ qrCodeValue }),
    setIdentificationCode: (identificationCode) => set({ identificationCode }),
}));

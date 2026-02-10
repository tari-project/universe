// TODO consolidate modals

import { create } from 'zustand';

interface ModalStoreState {
    showScheduler: boolean;
    showConfirmLocation: boolean;
}
const initialState: ModalStoreState = {
    showScheduler: false,
    showConfirmLocation: false,
};

export const useModalStore = create<ModalStoreState>()(() => ({ ...initialState }));

export const setShowScheduler = (showScheduler: boolean) => useModalStore.setState({ showScheduler });
export const setShowConfirmLocation = (showConfirmLocation: boolean) => useModalStore.setState({ showConfirmLocation });

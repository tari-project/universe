// TODO consolidate modals

import { create } from 'zustand';

interface ModalStoreState {
    showScheduler: boolean;
}
const initialState: ModalStoreState = {
    showScheduler: false,
};

export const useModalStore = create<ModalStoreState>()(() => ({ ...initialState }));

export const setShowScheduler = (showScheduler: boolean) => useModalStore.setState({ showScheduler });

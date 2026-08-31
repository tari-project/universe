import { create } from 'zustand';

export interface LatestUpdate {
    url: string;
    title: string;
}

interface LatestUpdateStoreState {
    latestUpdate?: LatestUpdate | null;
}

const initialState: LatestUpdateStoreState = {
    latestUpdate: null,
};

export const useLatestUpdateStore = create<LatestUpdateStoreState>()(() => ({
    ...initialState,
}));

export const setLatestUpdate = (latestUpdate: LatestUpdate | null) => {
    useLatestUpdateStore.setState({ latestUpdate });
};

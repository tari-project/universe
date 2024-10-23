import { createWithEqualityFn as _create } from 'zustand/traditional'; //https://zustand.docs.pmnd.rs/migrations/migrating-to-v5#requiring-stable-selector-outputs
import type { StateCreator } from 'zustand';

const storeResetFns = new Set<() => void>();

export const resetAllStores = () => {
    storeResetFns.forEach((resetFn) => {
        resetFn();
    });
};

export const create = (<T>() => {
    return (stateCreator: StateCreator<T>) => {
        const store = _create(stateCreator);
        const initialState = store.getInitialState();
        storeResetFns.add(() => {
            store.setState(initialState, true);
        });
        return store;
    };
}) as typeof _create;

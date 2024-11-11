import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ToastType = 'default' | 'error' | 'warning' | 'success';

interface Toast {
    id?: number | string;
    title: string;
    text?: string;
    timeout?: number;
    type?: ToastType;
}

interface ToastStore {
    toasts: Toast[];
    addToast: (toast: Toast) => void;
    removeToast: (id: number | string) => void;
}

export const useToastStore = create<ToastStore>()(
    devtools((set) => ({
        toasts: [],
        addToast: (toast) =>
            set((state) => {
                const { id: toastId, ...toastWithoutId } = toast;
                const id = toastId || Date.now();

                const stateToasts = state.toasts.filter((t) => t.id !== 'loading-toast');

                let newToasts = [...stateToasts, { id, ...toastWithoutId }];

                if (newToasts.length > 3) {
                    newToasts = newToasts.slice(1); // Remove the oldest toast
                }

                return { toasts: newToasts };
            }),
        removeToast: (id) =>
            set((state) => ({
                toasts: state.toasts.filter((toast) => toast.id !== id),
            })),
    }))
);

export function addToast(toast: Toast) {
    return useToastStore.getState().addToast(toast);
}

export function removeToast(id: number | string) {
    return useToastStore.getState().removeToast(id);
}

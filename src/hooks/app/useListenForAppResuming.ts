import { useAppStateStore } from '@app/store/appStateStore';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

export interface ResumingAllProcessesPayload {
    title: string;
    stage_progress: number;
    stage_total: number;
    is_resuming: boolean;
}

export const useListenForAppResuming = () => {
    const setAppResumePayload = useAppStateStore((state) => state.setAppResumePayload);

    useEffect(() => {
        const listener = listen('resuming-all-processes', ({ payload }: { payload: ResumingAllProcessesPayload }) => {
            setAppResumePayload(payload);
        });

        return () => {
            listener.then((unlisten) => unlisten());
        };
    }, [setAppResumePayload]);
};

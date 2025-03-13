import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { setAppResumePayload } from '@app/store/actions/appStateStoreActions.ts';

export interface ResumingAllProcessesPayload {
    title: string;
    stage_progress: number;
    stage_total: number;
    is_resuming: boolean;
}

export const useListenForAppResuming = () => {
    useEffect(() => {
        const listener = listen('resuming-all-processes', ({ payload }: { payload: ResumingAllProcessesPayload }) => {
            setAppResumePayload(payload);
        });

        return () => {
            listener.then((unlisten) => unlisten());
        };
    }, []);
};

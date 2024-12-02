import { useAppStateStore } from '@app/store/appStateStore';
import { CriticalProblem } from '@app/types/app-status';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

const useListenForCriticalProblem = () => {
    const setCriticalProblem = useAppStateStore((s) => s.setCriticalProblem);
    useEffect(() => {
        const unlistenPromise = listen<CriticalProblem>('critical_problem', ({ payload }) => {
            setCriticalProblem(payload);
        });

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [setCriticalProblem]);
};

export default useListenForCriticalProblem;

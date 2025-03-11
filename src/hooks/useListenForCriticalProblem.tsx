import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { CriticalProblem } from '@app/types/app-status';
import { setCriticalProblem } from '@app/store/actions';

const useListenForCriticalProblem = () => {
    useEffect(() => {
        const unlistenPromise = listen<CriticalProblem>('critical_problem', ({ payload }) => {
            setCriticalProblem(payload);
        });

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, []);
};

export default useListenForCriticalProblem;

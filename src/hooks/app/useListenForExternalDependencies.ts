import { loadExternalDependencies } from '@app/store/actions/appStateStoreActions.ts';
import { setShowExternalDependenciesDialog } from '@app/store';
import { ExternalDependency } from '@app/types/app-status';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

export function useListenForExternalDependencies() {
    useEffect(() => {
        const unlistenPromise = listen<ExternalDependency[]>('missing-applications', (event) => {
            const missingDependencies = event.payload;
            loadExternalDependencies(missingDependencies);
            setShowExternalDependenciesDialog(true);
        });

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, []);
}

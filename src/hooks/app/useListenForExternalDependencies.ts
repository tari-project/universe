import { useAppStateStore } from '@app/store/appStateStore';
import { useUIStore } from '@app/store/useUIStore';
import { ExternalDependency } from '@app/types/app-status';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

export function useListenForExternalDependencies() {
    const loadExternalDependencies = useAppStateStore((s) => s.loadExternalDependencies);
    const setShowExternalDependenciesDialog = useUIStore((s) => s.setShowExternalDependenciesDialog);
    useEffect(() => {
        const unlistenPromise = listen<ExternalDependency[]>('missing-applications', (event) => {
            const missingDependencies = event.payload;
            loadExternalDependencies(missingDependencies);
            setShowExternalDependenciesDialog(true);
        });

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

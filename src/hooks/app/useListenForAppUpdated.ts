import { useUIStore } from '@app/store/useUIStore';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

interface UseListenForAppUpdatedOptions {
    triggerEffect?: boolean;
}
export const useListenForAppUpdated = (options: UseListenForAppUpdatedOptions) => {
    const { triggerEffect } = options;
    const { setDialogToShow } = useUIStore();

    useEffect(() => {
        if (!triggerEffect) return;

        const listToShowReleaseNotes = listen('show_release_notes', async () => {
            setDialogToShow('releaseNotes');
        });

        return () => {
            listToShowReleaseNotes.then((unlisten) => unlisten());
        };
    }, []);
};

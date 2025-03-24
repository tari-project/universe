import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { setDialogToShow, setIsAppUpdateAvailable, setReleaseNotes } from '@app/store';

interface UseListenForAppUpdatedOptions {
    triggerEffect?: boolean;
}

interface ShowReleaseNotesPayload {
    release_notes?: string;
    is_app_update_available: boolean;
    should_show_dialog: boolean;
}

export const useListenForAppUpdated = (options: UseListenForAppUpdatedOptions) => {
    const { triggerEffect } = options;

    useEffect(() => {
        if (!triggerEffect) return;

        const listToShowReleaseNotes = listen(
            'release_notes_handler',
            ({ payload }: { payload: ShowReleaseNotesPayload }) => {
                setReleaseNotes(payload.release_notes || '');
                setIsAppUpdateAvailable(payload.is_app_update_available);
                if (payload.should_show_dialog) {
                    setDialogToShow('releaseNotes');
                }
            }
        );

        return () => {
            listToShowReleaseNotes.then((unlisten) => unlisten());
        };
    }, [triggerEffect]);
};

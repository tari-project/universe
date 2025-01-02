import { useEffect } from 'react';
import { useUIStore } from '@app/store/useUIStore';

const CHANGELOG_URL = `https://cdn.jsdelivr.net/gh/tari-project/universe@main/CHANGELOG.md`;

interface UseReleaseNotesOptions {
    triggerEffect?: boolean;
}

export function useReleaseNotes(options: UseReleaseNotesOptions = {}) {
    const { triggerEffect } = options;
    const { setDialogToShow } = useUIStore();

    const fetchReleaseNotes = async () => {
        const response = await fetch(CHANGELOG_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    };

    useEffect(() => {
        if (triggerEffect) {
            setDialogToShow('releaseNotes');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [triggerEffect]);

    return { fetchReleaseNotes, CHANGELOG_URL };
}

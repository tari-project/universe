import { useEffect } from 'react';
import { useUIStore } from '@app/store/useUIStore';
import packageInfo from '../../../../../../package.json';

interface UseReleaseNotesOptions {
    triggerEffect?: boolean;
}

function getLatestVersionFromChangelog(changelog: string): string | null {
    const versionRegex = /v(\d+\.\d+\.\d+)/;
    const match = changelog.match(versionRegex);
    return match ? match[1] : null;
}

const CHANGELOG_URL = `https://cdn.jsdelivr.net/gh/tari-project/universe@main/CHANGELOG.md`;

export function useReleaseNotes(options: UseReleaseNotesOptions = {}) {
    const { triggerEffect } = options;
    const { setDialogToShow } = useUIStore();

    const appVersion = packageInfo.version;
    //const appVertion = '0.8.25';

    const fetchReleaseNotes = async () => {
        const response = await fetch(CHANGELOG_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    };

    useEffect(() => {
        if (!triggerEffect) return;

        // TODO: Need to save the fetched releaseNotesVersion to persistant storage
        //       and compare it with the appVersion to determine if the release notes
        //       dialog has already been shown to the user.

        fetchReleaseNotes()
            .then((notes) => {
                const releaseNotesVersion = getLatestVersionFromChangelog(notes);

                if (releaseNotesVersion === appVersion) {
                    setDialogToShow('releaseNotes');
                }

                //console.log('Fetched Release Notes version:', releaseNotesVersion);
                //console.log('App version:', appVersion);
            })
            .catch((error) => {
                console.error('Failed to fetch release notes:', error);
            });
    }, [triggerEffect, setDialogToShow]);

    return { fetchReleaseNotes, CHANGELOG_URL };
}

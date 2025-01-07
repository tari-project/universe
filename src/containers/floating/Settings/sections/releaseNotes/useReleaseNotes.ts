import { useEffect } from 'react';
import { useUIStore } from '@app/store/useUIStore';
import packageInfo from '../../../../../../package.json';
import { invoke } from '@tauri-apps/api/core';

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

    const fetchReleaseNotes = async () => {
        const response = await fetch(CHANGELOG_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    };

    useEffect(() => {
        if (!triggerEffect) return;

        const currentAppVersion = packageInfo.version;

        invoke('get_last_changelog_version').then((lastSavedChangelogVersion: unknown) => {
            if (lastSavedChangelogVersion === currentAppVersion) return;

            fetchReleaseNotes()
                .then((notes) => {
                    const releaseNotesVersion = getLatestVersionFromChangelog(notes);

                    if (releaseNotesVersion != lastSavedChangelogVersion && currentAppVersion === releaseNotesVersion) {
                        setDialogToShow('releaseNotes');
                        invoke('set_last_changelog_version', { version: releaseNotesVersion });
                    }
                })
                .catch((error) => {
                    console.error('Failed to fetch release notes:', error);
                });
        });
    }, [triggerEffect, setDialogToShow]);

    return { fetchReleaseNotes, CHANGELOG_URL };
}

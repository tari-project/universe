import { useEffect, useCallback, useRef } from 'react';
import { useAppStatusStore } from '../store/useAppStatusStore';
import { invoke } from '@tauri-apps/api';
import { checkUpdate, installUpdate, onUpdaterEvent } from '@tauri-apps/api/updater';
import { useInterval } from '@app/hooks/useInterval.ts';

export function useApplicationsVersions() {
    const setApplicationsVersions = useAppStatusStore((state) => state.setApplicationsVersions);

    const getApplicationsVersions = useCallback(() => {
        invoke('get_applications_versions')
            .then((applicationsVersions) => {
                setApplicationsVersions(applicationsVersions);
            })
            .catch((error) => {
                console.error('Error getting applications versions', error);
            });
    }, [setApplicationsVersions]);

    const refreshApplicationsVersions = useCallback(() => {
        invoke('update_applications')
            .then(() => {
                getApplicationsVersions();
            })
            .catch((error) => {
                console.error('Error updating applications versions', error);
            });
    }, [getApplicationsVersions]);

    return { refreshApplicationsVersions, getApplicationsVersions };
}

export function useVersions() {
    const applicationsVersions = useAppStatusStore((state) => state.applications_versions);
    const { getApplicationsVersions } = useApplicationsVersions();
    const areAllVersionsPresent = useRef(false);

    useEffect(() => {
        areAllVersionsPresent.current = applicationsVersions
            ? Object.values(applicationsVersions).every((version) => version !== undefined)
            : false;
    }, [applicationsVersions]);

    useEffect(() => {
        if (areAllVersionsPresent.current) return;
        return () => {
            getApplicationsVersions();
        };
    }, [applicationsVersions, getApplicationsVersions]);
}

export function useMainAppVersion() {
    const UPDATE_CHECK_INTERVAL = 1000 * 60 * 60 * 24; // 1 day
    const handleUpdate = useCallback(async () => {
        try {
            const updateRes = await checkUpdate();
            if (updateRes.shouldUpdate && updateRes.manifest) {
                console.info(
                    `Installing update ${updateRes.manifest.version}, ${updateRes.manifest.date}, ${updateRes.manifest.body}`
                );
                await installUpdate();
            }
        } catch (e) {
            console.error('Error checking for update', e);
        }
    }, []);

    useInterval(() => handleUpdate(), UPDATE_CHECK_INTERVAL);

    useEffect(() => {
        const ul = onUpdaterEvent(({ error, status }) => {
            console.info('Updater event', error, status);
        });

        return () => {
            ul.then((unlisten) => unlisten());
        };
    }, []);
}

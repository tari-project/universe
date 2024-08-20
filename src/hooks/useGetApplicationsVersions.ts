import { useEffect, useCallback } from 'react';
import { useAppStatusStore } from '../store/useAppStatusStore';
import { invoke } from '@tauri-apps/api';
import { ApplicationsVersions } from '../types/app-status';
import { getVersion } from '@tauri-apps/api/app';

export const useGetApplicationsVersions = () => {
    const applicationsVersions = useAppStatusStore((state) => state.applications_versions);
    const setApplicationsVersions = useAppStatusStore((state) => state.setApplicationsVersions);

    const mainAppVersion = useAppStatusStore((state) => state.main_app_version);
    const setMainAppVersion = useAppStatusStore((state) => state.setMainAppVersion);
    const getApplicationsVersions = useCallback(async () => {
        invoke<ApplicationsVersions>('get_applications_versions')
            .then((applicationsVersions) => {
                setApplicationsVersions(applicationsVersions);
            })
            .catch((error) => {
                console.error('Error getting applications versions', error);
            });
    }, [setApplicationsVersions]);

    useEffect(() => {
        if (!mainAppVersion) {
            getVersion().then((version) => {
                setMainAppVersion(version);
            });
        }
    }, [mainAppVersion, setMainAppVersion]);

    useEffect(() => {
        const areAllVersionsPresent = applicationsVersions
            ? Object.values(applicationsVersions).every((version) => version !== undefined)
            : false;

        if (areAllVersionsPresent) return;

        return () => {
            getApplicationsVersions()
                .then(() => console.info('Versions fetched'))
                .catch(console.error);
        };
    }, [applicationsVersions, getApplicationsVersions]);

    return { applicationsVersions, getApplicationsVersions };
};

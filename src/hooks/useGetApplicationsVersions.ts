import { useEffect, useCallback } from 'react';
import { useAppStatusStore } from '../store/useAppStatusStore';
import { invoke } from '@tauri-apps/api';

export const useGetApplicationsVersions = () => {
    const applicationsVersions = useAppStatusStore((state) => state.applications_versions);
    const setApplicationsVersions = useAppStatusStore((state) => state.setApplicationsVersions);

    const getApplicationsVersions = useCallback(async () => {
        invoke('get_applications_versions')
            .then((applicationsVersions) => {
                setApplicationsVersions(applicationsVersions);
            })
            .catch((error) => {
                console.error('Error getting applications versions', error);
            });
    }, [setApplicationsVersions]);

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

    const updateApplicationsVersions = useCallback(() => {
        invoke('update_applications')
            .then(() => {
                getApplicationsVersions();
            })
            .catch((error) => {
                console.error('Error updating applications versions', error);
            });
    }, [getApplicationsVersions]);

    return { applicationsVersions, getApplicationsVersions, updateApplicationsVersions };
};

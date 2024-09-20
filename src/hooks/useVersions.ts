import { useEffect, useCallback, useRef } from 'react';
import { useAppStatusStore } from '../store/useAppStatusStore';
import { invoke } from '@tauri-apps/api';
import { useShallow } from 'zustand/react/shallow';

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
    const applicationsVersions = useAppStatusStore(useShallow((state) => state.applications_versions));
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

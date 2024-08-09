import { useCallback, useEffect } from 'react';
import { useAppStatusStore } from '../store/useAppStatusStore';
import { invoke } from '@tauri-apps/api';
import { ApplicationsVersions } from '../types/app-status';

export const getApplicationsVersions = async () => {
    invoke<ApplicationsVersions>('get_applications_versions')
        .then((applicationsVersions) => {
            useAppStatusStore.setState({
                applications_versions: applicationsVersions,
            });
        })
        .catch((error) => {
            console.log('Error getting applications versions', error);
        });
};

export const useGetApplicatonsVersions = () => {
    const applicationsVersions = useAppStatusStore(
        (state) => state.applications_versions
    );

    useEffect(() => {
        if (!applicationsVersions) {
            getApplicationsVersions();
        }

        if (applicationsVersions) {
            const areAllVersionsPresent = Object.values(
                applicationsVersions
            ).every((version) => version !== undefined);

            if (!areAllVersionsPresent) {
                getApplicationsVersions();
            }
        }
    }, [applicationsVersions]);

    const refreshVersions = useCallback(() => {
        getApplicationsVersions();
    }, []);

    return { applicationsVersions, refreshVersions };
};

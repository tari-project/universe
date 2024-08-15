import { useCallback, useEffect } from 'react';
import { useAppStatusStore } from '../store/useAppStatusStore';
import { invoke } from '@tauri-apps/api';
import { ApplicationsVersions } from '../types/app-status';
import { getVersion } from '@tauri-apps/api/app';

export const getApplicationsVersions = async () => {
    invoke<ApplicationsVersions>('get_applications_versions')
        .then((applicationsVersions) => {
            useAppStatusStore.setState({
                applications_versions: applicationsVersions,
            });
        })
        .catch((error) => {
            console.error('Error getting applications versions', error);
        });
};

export const useGetApplicatonsVersions = () => {
    const applicationsVersions = useAppStatusStore(
        (state) => state.applications_versions
    );

    const mainAppVersion = useAppStatusStore((state) => state.main_app_version);
    const setMainAppVersion = useAppStatusStore(
        (state) => state.setMainAppVersion
    );

    useEffect(() => {
        if (!mainAppVersion) {
            getVersion().then((version) => {
                setMainAppVersion(version);
            });
        }
    }, [mainAppVersion, setMainAppVersion]);

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

    return { applicationsVersions, mainAppVersion, refreshVersions };
};

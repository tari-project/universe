import { invoke } from '@tauri-apps/api/core';
import { useEffect } from 'react';
import { changeLanguage } from 'i18next';

export const useLangaugeResolver = () => {
    useEffect(() => {
        invoke('resolve_application_language').then((language) => {
            changeLanguage(language);
        });
    }, []);
};

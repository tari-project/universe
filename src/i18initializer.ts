import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

export enum Language {
    EN = 'en',
    PL = 'pl',
    AF = 'af',
    TR = 'tr',
}

export const LanguageList = Object.values(Language);

i18n.use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        lng: Language.EN,
        compatibilityJSON: 'v4',
        fallbackLng: Language.EN,
        fallbackNS: 'common',
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        supportedLngs: [Language.EN, Language.PL, Language.AF, Language.TR],
        saveMissingTo: 'all',
    });

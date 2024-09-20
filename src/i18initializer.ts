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

export enum LanguageNames {
    EN = 'English',
    PL = 'Polish',
    AF = 'Afrikaans',
    TR = 'Turkish',
}

export interface LanguageItem {
    key: Language;
    name: LanguageNames;
}
export const LanguageList: LanguageItem[] = Object.keys(Language).map((lang) => ({
    key: Language[lang],
    name: LanguageNames[lang],
}));

i18n.use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        lng: Language.EN,
        compatibilityJSON: 'v4',
        fallbackLng: Language.EN,
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        supportedLngs: [Language.EN, Language.PL, Language.AF, Language.TR],
        saveMissingTo: 'all',
    });

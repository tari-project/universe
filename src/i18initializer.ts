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

// https://github.com/ladjs/i18n-locales
// System can have en-US instead of en so we have to resolve it
export const resolveI18nLanguage = (languageCode: string): Language => {
    switch (languageCode) {
        case 'en':
        case 'en-AU':
        case 'en-BZ':
        case 'en-CA':
        case 'en-CB':
        case 'en-GB':
        case 'en-IE':
        case 'en-JM':
        case 'en-NZ':
        case 'en-PH':
        case 'en-TT':
        case 'en-US':
        case 'en-ZA':
        case 'en-ZW':
            return Language.EN;
        case 'pl':
        case 'pl-PL':
            return Language.PL;
        case 'af':
        case 'af-ZA':
            return Language.AF;
        case 'tr':
        case 'tr-TR':
            return Language.TR;
        default:
            return Language.EN;
    }
};

export const LanguageList: Record<Language, string> = {
    [Language.EN]: 'English',
    [Language.PL]: 'Polski',
    [Language.AF]: 'Afrikaans',
    [Language.TR]: 'Türkçe',
};

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

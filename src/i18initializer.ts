import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

export enum Language {
    EN = 'en',
    PL = 'pl',
    AF = 'af',
    TR = 'tr',
    CN = 'cn', // Chinese, folder is 'cn'
    HI = 'hi',
    ID = 'id',
    JA = 'ja',
    KO = 'ko',
    RU = 'ru',
    FR = 'fr',
    DE = 'de', // German
}

// System can have various regional variations for language codes, so we resolve them
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
        case 'cn':
        case 'zh':
        case 'zh-CN':
        case 'zh-HK':
        case 'zh-MO':
        case 'zh-SG':
        case 'zh-TW':
            return Language.CN; // Map to 'cn' folder
        case 'hi':
        case 'hi-IN':
            return Language.HI;
        case 'id':
        case 'id-ID':
            return Language.ID;
        case 'ja':
        case 'ja-JP':
            return Language.JA;
        case 'ko':
        case 'ko-KR':
            return Language.KO;
        case 'ru':
        case 'ru-RU':
            return Language.RU;
        case 'fr':
        case 'fr-BE':
        case 'fr-CA':
        case 'fr-CH':
        case 'fr-FR':
        case 'fr-LU':
        case 'fr-MC':
            return Language.FR;
        case 'de':
        case 'de-AT':
        case 'de-CH':
        case 'de-DE':
        case 'de-LI':
        case 'de-LU':
            return Language.DE;
        default:
            return Language.EN;
    }
};

// Language names for display
export const LanguageList: Record<Language, string> = {
    [Language.EN]: 'English',
    [Language.PL]: 'Polski',
    [Language.AF]: 'Afrikaans',
    [Language.TR]: 'Türkçe',
    [Language.CN]: '简体中文', // Simplified Chinese
    [Language.HI]: 'हिन्दी', // Hindi
    [Language.ID]: 'Bahasa Indonesia',
    [Language.JA]: '日本語', // Japanese
    [Language.KO]: '한국어', // Korean
    [Language.RU]: 'Русский', // Russian
    [Language.FR]: 'Français', // French
    [Language.DE]: 'Deutsch', // German
};

// Initialize i18n with new supported languages
i18n.use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        // debug: process.env.NODE_ENV === 'development',
        lng: Language.EN,
        compatibilityJSON: 'v4',
        fallbackLng: Language.EN,
        fallbackNS: 'common',
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        supportedLngs: [
            Language.EN,
            Language.PL,
            Language.AF,
            Language.TR,
            Language.CN,
            Language.HI,
            Language.ID,
            Language.JA,
            Language.KO,
            Language.RU,
            Language.FR,
            Language.DE,
        ],
        saveMissingTo: 'all',
        contextSeparator: '-',
    })
    .then(() => {
        console.info('i18n initialized');
    });

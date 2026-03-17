import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
    cleanup();
});

// Mock window.matchMedia for theme detection
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock i18next
vi.mock('i18next', () => {
    const i18n = {
        language: 'en',
        t: (key: string) => key,
        use: vi.fn().mockReturnThis(),
        init: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
        off: vi.fn(),
        changeLanguage: vi.fn().mockResolvedValue(undefined),
    };
    return { default: i18n, t: i18n.t };
});

// Mock @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn().mockResolvedValue(undefined),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            language: 'en',
            changeLanguage: vi.fn(),
        },
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

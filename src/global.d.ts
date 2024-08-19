// global.d.ts
import { GlApp } from './glApp';

export {};

declare global {
    interface Window {
        glApp: GlApp;
    }
}

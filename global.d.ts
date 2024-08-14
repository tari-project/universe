// global.d.ts
import { GlApp, Properties, Result, Status } from './glApp';

export {};

declare global {
    interface Window {
        properties: Properties;
        STATUS: Status;
        RESULT: Result;
        glApp: GlApp;
    }
}

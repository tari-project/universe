// global.d.ts
import { GlApp, Properties, Result, Status } from './glApp';

export {};

declare global {
    interface Window {
        glApp: GlApp & {
            properties: Properties;
            STATUS: Status;
            RESULT: Result;
            stateManager: GlApp;
        };
    }
}

// global.d.ts
import { GlApp, Properties, Result, Status } from './glApp';
import { State } from 'zustand';

export {};

declare global {
    interface Window {
        preload(
            e: {
                canvas: Element;
                orbitTarget: Element;
                ASSETS_PATH: string;
            },
            t: () => void
        ): void;
        onStateChange(state: State): void;
        properties: Properties;
        STATUS: Status;
        RESULT: Result;
        glApp: GlApp & {
            properties: Properties;
            STATUS: Status;
            RESULT: Result;
            stateManager: GlApp;
        };
    }
}

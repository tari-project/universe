// global.d.ts
import { GlAppState, Properties, Result, Status } from './glApp';
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
        glApp: {
            set(e: GlAppState): void;
        };
    }
}

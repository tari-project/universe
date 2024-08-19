// glApp.d.ts

export interface Status {
    NOT_STARTED: 'not-started';
    STARTED: 'started';
    FREE: 'free';
    RESULT: 'result';
    RESULT_ANIMATION: 'result_animation';
    RESTART_ANIMATION: 'restart_animation';
    RESTART: 'restart';
}

export interface Result {
    NONE: 'none';
    PAUSE: 'pause';
    COMPLETED: 'completed';
    FAILED: 'failed';
}
export type GlAppState =
    | 'start'
    | 'free'
    | 'pause'
    | 'resume'
    | 'stop'
    | 'complete'
    | 'success'
    | 'fail'
    | 'resultAnimation'
    | 'restartAnimation'
    | 'restart';

export interface GlApp {
    preload(
        e: {
            canvas: Element;
            orbitTarget: Element;
            ASSETS_PATH: string;
        },
        t: () => void
    ): void;
    init(): void;
    set(e: GlAppState): void;
}

export interface Properties extends Record<string, unknown> {
    stateSignal: unknown;
    resultSignal: unknown;
    endCycleSignal: unknown;
    statusIndex: unknown;
    status: unknown;
    result: unknown;
    spawnSignal: unknown;
    gameEndedSignal: unknown;
    statusUpdateQueue: unknown;
}

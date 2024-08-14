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

export interface GlApp {
    status?: Status;
    preload(
        e: {
            canvas: Element;
            orbitTarget: Element;
            ASSETS_PATH: string;
        },
        t: () => void
    ): void;
    init(): void;
    setSize(e: number, t: number): void;
    render(e: number): void;
    setResult(e): void;
}

export interface Properties extends Record<string, unknown> {
    stateSignal: unknown;
    resultSignal: unknown;
    endCycleSignal: unknown;
}

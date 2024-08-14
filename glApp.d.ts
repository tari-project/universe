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

export class GlApp {
    preload(e: Element, t: () => void): void;
    init(): void;
    setSize(e: number, t: number): void;
    render(e: number): void;
    setResult(e): void;
}

export class Properties {
    stateSignal: {
        dispatch: (s: Status) => void;
    };
    resultSignal: {
        dispatch: (r: Result) => void;
    };
    endCycleSignal: {
        dispatch: () => void;
    };
}

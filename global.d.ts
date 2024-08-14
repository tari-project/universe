// global.d.ts
export {};

interface Status {
    NOT_STARTED: 'not-started';
    STARTED: 'started';
    FREE: 'free';
    RESULT: 'result';
    RESULT_ANIMATION: 'result_animation';
    RESTART_ANIMATION: 'restart_animation';
    RESTART: 'restart';
}

interface Result {
    NONE: 'none';
    PAUSE: 'pause';
    COMPLETED: 'completed';
    FAILED: 'failed';
}
declare global {
    interface Window {
        properties;
        STATUS: Status;
        RESULT: Result;
        glApp;
    }
}

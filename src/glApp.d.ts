// glApp.d.ts

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
    set(e: GlAppState): void;
    properties: Properties;
    stateManager: StateManager;
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

export interface StateManager extends Record<string, unknown> {
    set(e: GlAppState): void;
    statusIndex: unknown;
    status: unknown;
    result: unknown;
    stateSignal: unknown;
    spawnSignal: unknown;
    endCycleSignal: unknown;
    gameEndedSignal: unknown;
    statusUpdateQueue: unknown;
    hasNotStarted: boolean;
    isFailResult: boolean;
    isFree: boolean;
    isPaused: boolean;
    isRestart: boolean;
    isRestartAnimation: boolean;
    isResult: boolean;
    isResultAnimation: boolean;
    isStart: boolean;
    isStopped: boolean;
    isSuccessResult: boolean;
}

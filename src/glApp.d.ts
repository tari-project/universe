// glApp.d.ts

export type GlAppState =
    | 'showVisual'
    | 'start'
    | 'free'
    | 'pause'
    | 'resume'
    | 'stop'
    | 'complete'
    | 'success'
    | 'success2'
    | 'success3'
    | 'fail'
    | 'resultAnimation'
    | 'restartAnimation'
    | 'restart';

interface PreloadArgs {
    canvas?: HTMLElement | null;
    orbitTarget?: HTMLElement | null;
    ASSETS_PATH: string;
}
export interface GlApp {
    setState(e: GlAppState, isReplay?: boolean): void;
    init: () => void;
    render: (dt: number) => void;
    setSize: (w: number, h: number) => void;
    properties: Properties;
    stateManager: StateManager;
    preload: ({ canvas, orbitTarget, ASSETS_PATH }: PreloadArgs, callback: () => void) => void;
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
    lightPositionX: number;
    lightPositionY: number;
    lightPositionZ: number;
    bgColor1: string;
    bgColor2: string;
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

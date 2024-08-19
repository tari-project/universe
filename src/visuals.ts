import { GlAppState } from './glApp';

export function setStart() {
    if (window.glApp.stateManager.isPaused) {
        window.glApp.stateManager.set('resume');
    }
    window.glApp.stateManager.set('start');
}

export function setPause() {
    window.glApp.stateManager.set('pause');
    window.glApp.stateManager.isPaused = true;
}

export function setStop() {
    window.glApp.stateManager.set('stop');
}

export function setComplete() {
    window.glApp.stateManager.set('complete');
}
export async function setFail() {
    window.glApp.stateManager.set('fail');
}

export function setAnimationState(state: GlAppState) {
    const sM = window.glApp.stateManager;
    let newState = state;
    if (sM.isPaused && state == 'start') {
        newState = 'resume';
    }
    sM.set(newState);
    if (state == 'pause') {
        sM.isPaused = true;
    }
}

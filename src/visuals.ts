import { GlAppState } from './glApp';

export function setAnimationState(state: GlAppState) {
    const sM = window?.glApp?.stateManager;
    let newState = state;
    if (sM?.isPaused && state == 'start') {
        newState = 'resume';
    }

    sM?.set(newState);
    if (state == 'pause') {
        // needed to add this because the set() doesn't update their isPaused for some reason
        sM.isPaused = true;
    }
}

export function setLighting(x, y, z) {
    window.glApp.properties.lightPositionX = x;
    window.glApp.properties.lightPositionY = y;
    window.glApp.properties.lightPositionZ = z;
}

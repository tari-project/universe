import { GlAppState } from './glApp';

export function setAnimationState(state: GlAppState) {
    const sM = window?.glApp?.stateManager;
    let newState = state;
    if (sM?.isPaused && state == 'start') {
        newState = 'resume';
        sM.isPaused = false;
    }
    window.glApp.setState(newState);
    if (state == 'pause') {
        // needed to add this because the set() doesn't update their isPaused for some reason
        sM.isPaused = true;
    }
}

interface Property {
    property: string;
    value: unknown;
}
export function setAnimationProperties(properties: Property[]) {
    const app = window?.glApp;

    for (const item of properties) {
        app.properties[item.property] = item.value;
    }
}

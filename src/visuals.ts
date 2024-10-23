import { GlAppState } from './glApp';

export const animationLightBg = [
    { property: 'bgColor1', value: '#ffffff' },
    { property: 'bgColor2', value: '#d0d0d0' },
    { property: 'neutralColor', value: '#fff8ec' },
    { property: 'mainColor', value: '#0096ff' },
    { property: 'successColor', value: '#00c881' },
    { property: 'failColor', value: '#ca0101' },
    { property: 'goboIntensity', value: 0.45 },
];

export const animationDarkBg = [
    { property: 'bgColor1', value: '#212121' },
    { property: 'bgColor2', value: '#212121' },
    { property: 'neutralColor', value: '#040723' },
    { property: 'successColor', value: '#c9eb00' },
    { property: 'mainColor', value: '#813bf5' },
    { property: 'failColor', value: '#fe2c3f' },
    { property: 'goboIntensity', value: 0.75 },
];

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

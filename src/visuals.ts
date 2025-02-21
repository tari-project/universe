import { GlAppState } from './glApp';

export const animationLightBg = [
    { property: 'bgColor1', value: '#ffffff' },
    { property: 'bgColor2', value: '#d0d0d0' },
    { property: 'neutralColor', value: '#ffffff' },
    { property: 'mainColor', value: '#0096ff' },
    { property: 'successColor', value: '#00c881' },
    { property: 'failColor', value: '#ca0101' },
    { property: 'particlesColor', value: '#505050' },
    { property: 'goboIntensity', value: 0.45 },
    { property: 'particlesOpacity', value: 0.75 },
    { property: 'particlesSize', value: 0.01 },
];

export const animationDarkBg = [
    { property: 'bgColor1', value: '#212121' },
    { property: 'bgColor2', value: '#212121' },
    { property: 'neutralColor', value: '#040723' },
    { property: 'successColor', value: '#c9eb00' },
    { property: 'mainColor', value: '#813bf5' },
    { property: 'failColor', value: '#ff5610' },
    { property: 'particlesColor', value: '#813bf5' },
    { property: 'goboIntensity', value: 0.75 },
    { property: 'particlesOpacity', value: 0.95 },
    { property: 'particlesSize', value: 0.02 },
];

export function setAnimationState(newState: GlAppState, isReplay = false) {
    window.glApp.setState(newState, isReplay);
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

import { GlAppState } from './glApp';

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

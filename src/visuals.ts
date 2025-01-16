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
    { property: 'failColor', value: '#fe2c3f' },
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

let time: number;
let lastRender: number;
const targetFPS = 40;
const frameInterval = 1 / targetFPS;

const glApp = window.glApp;

export function destroyCanvas() {
    setAnimationState('stop');
    const canvas = document.getElementById('canvas');

    canvas?.remove();
}

export async function reinstateCanvas() {
    let canPreload = false;
    const currentCanvas = document.getElementById('canvas');
    if (currentCanvas) {
        canPreload = true;
    }
    if (!currentCanvas) {
        const newCanvas = document.createElement('canvas');
        const main = document.getElementById('main');
        if (main && newCanvas) {
            newCanvas.id = 'canvas';
            newCanvas.innerText = '';
            canPreload = true;
            main.appendChild(newCanvas);
        }
    }

    if (canPreload) {
        preloadTower();
    }
}

export function preloadTower() {
    const canvasEl = document.getElementById('canvas');
    if (canvasEl) {
        glApp.preload({ canvas: canvasEl, orbitTarget: canvasEl, ASSETS_PATH: '/assets/' }, () => {
            init();
        });
    }
}

function init() {
    glApp.init();
    time = performance.now() / 1000;
    lastRender = time;
    window.addEventListener('resize', onResize);

    onResize();
    animate();
}

function animate() {
    const newTime = performance.now() / 1000;
    const dt = newTime - time;
    if (newTime - lastRender >= frameInterval) {
        lastRender = newTime;
        update(dt);
        time = newTime;
    }

    requestAnimationFrame(animate);
}

function update(dt: number) {
    glApp.render(dt);
}

function onResize() {
    const sidebarOffset = 348 + 20; // sidebar + padding
    glApp.properties.cameraOffsetX = sidebarOffset / window.innerWidth;
    glApp.setSize(window.innerWidth, window.innerHeight);
}

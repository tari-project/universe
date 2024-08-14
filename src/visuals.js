import '/assets/vis-index.js?url&init';

let time;
export const preload = () => {
    const el = document.getElementById('canvas');
    if (el && window.glApp) {
        window.glApp.preload(
            {
                canvas: el,
                orbitTarget: el,
                ASSETS_PATH: '/assets/',
            },
            () => {
                init();
            }
        );
    }
};

function init() {
    window.glApp?.init();
    time = performance.now() / 1000;

    window.addEventListener('resize', onResize);
    onResize();
    animate();
}

function onResize() {
    window.glApp.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    let newTime = performance.now() / 1000;
    let dt = newTime - time;
    time = newTime;

    update(dt);
}

function update(dt) {
    window.glApp.render(dt);
}

export function setStop() {
    window.properties.stateSignal.dispatch(window.STATUS.NOT_STARTED);
}
export function setRestart() {
    window.properties.stateSignal.dispatch(window.STATUS.FREE);
}

export const setStart = () => {
    window.properties.stateSignal.dispatch(window.STATUS.STARTED);
};

export const setSuccess = () => {
    window.properties.resultSignal.dispatch(window.RESULT.COMPLETED);
};

export const setFailure = () => {
    window.properties.resultSignal.dispatch(window.RESULT.FAILED);
};

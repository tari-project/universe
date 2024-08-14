const glApp = await import('/assets/vis-index.js?url&init');

console.log('vis:');

console.log(glApp.preload);

let time;
export const preload = () => {
    const el = document.getElementById('canvas');
    console.log(glApp);
    if (el && glApp) {
        glApp.preload(
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
    glApp?.init();
    time = performance.now() / 1000;

    window.addEventListener('resize', onResize);
    onResize();
    animate();
}

function onResize() {
    glApp.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    let newTime = performance.now() / 1000;
    let dt = newTime - time;
    time = newTime;

    update(dt);
}

function update(dt) {
    glApp.render(dt);
}

export function setStop() {
    properties.stateSignal.dispatch(STATUS.NOT_STARTED);
}
export function setRestart() {
    properties.stateSignal.dispatch(STATUS.FREE);
}

export const setStart = () => {
    properties.stateSignal.dispatch(STATUS.STARTED);
};

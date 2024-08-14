// import '/assets/vis-index.js?url&init';

let time;

export function preload() {
    const el = document.getElementById('canvas');
    window.glApp?.preload(
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

function init() {
    window.glApp.init();
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

export async function setStop() {
    window.properties?.stateSignal.dispatch(window.STATUS.NOT_STARTED);
    return window.properties;
}
export async function setRestart() {
    window.properties?.stateSignal.dispatch(window.STATUS.FREE);
    return window.properties;
}

export async function setStart() {
    window.properties?.stateSignal.dispatch(window.STATUS.STARTED);
    return window.properties;
}

export async function setSuccess() {
    window.properties?.resultSignal.dispatch(window.RESULT.COMPLETED);
    return window.properties;
}

export async function setFailure() {
    window.properties?.resultSignal.dispatch(window.RESULT.FAILED);
    return window.properties;
}

import '/assets/vis-index.js?url&init';

let time;
export function preload() {
    const el = document.getElementById('canvas');
    console.log('vis:');
    console.log(window.glApp?.preload);
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

export function setStop() {
    console.log(window.properties);
    window.properties?.stateSignal.dispatch(window.STATUS.NOT_STARTED);
}
export function setRestart() {
    console.log(window.properties);
    window.properties?.stateSignal.dispatch(window.STATUS.FREE);
}

export function setStart() {
    console.log(window.properties);
    window.properties?.stateSignal.dispatch(window.STATUS.STARTED);
}

export function setSuccess() {
    window.properties?.resultSignal.dispatch(window.RESULT.COMPLETED);
}

export function setFailure() {
    window.properties?.resultSignal.dispatch(window.RESULT.FAILED);
}

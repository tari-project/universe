let time;

export const preload = () => {
    const el = document.getElementById('canvas');
    if (el) {
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
    glApp.init();
    time = performance.now() / 1000;
    glApp.setSize(window.innerWidth + 600, window.innerHeight);

    window.addEventListener('resize', onResize);
    onResize();
    animate();
}

function onResize() {
    glApp.setSize(window.innerWidth + 100, window.innerHeight);
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

export function setStart() {
    properties.stateSignal.dispatch(STATUS.STARTED);
}

function setSuccess() {
    properties.resultSignal.dispatch(RESULT.COMPLETED);
}

function setFailure() {
    properties.resultSignal.dispatch(RESULT.FAILED);
}

export function setPause() {
    properties.resultSignal.dispatch(RESULT.PAUSE);
}

function onNewSpawn(callback) {
    if (callback && typeof callback === 'function') {
        properties.spawnSignal.add(callback);
    }
}

function onGameEnd(callback) {
    if (callback && typeof callback === 'function') {
        properties.gameEndedSignal.add(callback);
    }
}

function onCycleEnd(callback) {
    if (callback && typeof callback === 'function') {
        properties.endCycleSignal.add(callback);
    }
}

function onStateChange(callback) {
    if (callback && typeof callback === 'function') {
        properties.stateSignal.add((newState) => callback(newState));
    }
}

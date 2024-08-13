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

export const setStart = () => {
    properties.stateSignal.dispatch(STATUS.STARTED);
};

function setSuccess() {
    properties.resultSignal.dispatch(RESULT.COMPLETED);
}

function setFailure() {
    properties.resultSignal.dispatch(RESULT.FAILED);
}

export const setPause = () => {
    properties.resultSignal.dispatch(RESULT.PAUSE);
    properties.stateSignal.dispatch(STATUS.NOT_STARTED);
};

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

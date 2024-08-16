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
    window.glApp.properties.cameraOffsetX = 0.3;
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
    window.glApp.stateManager.setStop();
}
export async function setRestart() {
    window.glApp.stateManager.setFree();
}

export async function setStart() {
    window.glApp.stateManager.setStart();
}

// export async function setSuccess() {
//     window.glApp.stateManager.setComplete();
// }

export async function setFailure() {
    window.glApp.stateManager.setFail();
}

// function setPause() {
//     window.glApp.stateManager.setPause();
// }

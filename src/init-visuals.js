let time;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function preload() {
    window.glApp?.preload(
        {
            canvas: document.getElementById('canvas'),
            orbitTarget: document.getElementById('canvas'),
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
    window.glApp.properties.cameraOffsetX = 0.33;
    window.glApp.properties.cameraZoom = 0.75;

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

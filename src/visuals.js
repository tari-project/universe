export function setStart() {
    window.glApp.stateManager.setStart();
    console.log(`window app:}`);
    console.log(window.glApp.stateManager);
}

export function setPause() {
    window.glApp.stateManager.status = 'not-started';
    window.glApp.stateManager.statusIndex = 0;
    window.glApp.stateManager.updateFlags();
    console.log(window.glApp.stateManager);
}

export function setStop() {
    window.glApp.stateManager.setStop();
}

export function setComplete() {
    window.glApp.stateManager.setComplete();
}

export function setFail() {
    window.glApp.stateManager.setFail();
}

export function setRestartAnimation() {
    window.glApp.stateManager.status = 'free';
    window.glApp.stateManager.statusIndex = 2;
    window.glApp.stateManager.updateFlags();
    console.log(window.glApp.stateManager);
}

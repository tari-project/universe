export function setStart() {
    window.glApp.set('start');
}

export function setPause() {
    window.glApp.set('pause');
}

export function setStop() {
    window.glApp.set('stop');
}

export function setComplete() {
    window.glApp.stateManager.setComplete();
}

export async function setFail() {
    window.glApp.set('fail');
}

export function setRestartAnimation() {
    window.glApp.stateManager.status = 'free';
    window.glApp.stateManager.statusIndex = 2;
    window.glApp.stateManager.updateFlags();
}
export function reset() {
    window.glApp.stateManager.reset();
}

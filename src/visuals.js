export function setStart() {
    window.glApp.stateManager.status = 'free';
    window.glApp.stateManager.statusIndex = 2;
    window.glApp.stateManager.updateFlags();
}

export function setPause() {
    const queue = window.glApp.stateManager.statusUpdateQueue;

    function wrapUp() {
        window.glApp.stateManager.status = 'result_animation';
        window.glApp.stateManager.statusIndex = 4;
        window.glApp.stateManager.updateFlags();
    }
    function end() {
        window.glApp.stateManager.status = 'not-started';
        window.glApp.stateManager.statusIndex = 0;
        window.glApp.stateManager.updateFlags();
    }

    queue.push(() => wrapUp());
    queue.push(() => end());

    window.glApp.stateManager.statusUpdateQueue = queue;
}

export function setStop() {
    window.glApp.stateManager.setStop();
}

export function setComplete() {
    window.glApp.stateManager.setComplete();
}

export async function setFail() {
    let finished = false;
    try {
        const queue = [];

        function initFail() {
            window.glApp.stateManager.status = 'result_animation';
            window.glApp.stateManager.statusIndex = 4;
            window.glApp.stateManager.result = 'failed';
            window.glApp.stateManager.isResultAnimation = true;

            // window.glApp.stateManager.updateFlags();
        }
        function wrapUp() {
            window.glApp.stateManager.status = 'result';
            window.glApp.stateManager.statusIndex = 3;
            window.glApp.stateManager.result = 'failed';
            window.glApp.stateManager.isResult = true;
        }

        queue.push(() => initFail());
        queue.push(() => wrapUp());

        window.glApp.stateManager.statusUpdateQueue = queue;
    } catch (_e) {
    } finally {
        finished = true;
    }

    return finished;
}

export function setRestartAnimation() {
    window.glApp.stateManager.status = 'free';
    window.glApp.stateManager.statusIndex = 2;
    window.glApp.stateManager.updateFlags();
}
export function reset() {
    window.glApp.stateManager.reset();
}

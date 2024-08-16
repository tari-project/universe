export function setStart() {
    window.glApp.stateManager.setStart();
}

export function setPause() {
    window.glApp.stateManager.setPause();
    // window.glApp.stateManager.statusUpdateQueue.push(() =>
    //     window.glApp.stateManager.updateStatusAndResult('none', 'pause')
    // );
    // console.log('clicked pause!');
    // window.glApp.stateManager.statusUpdateQueue.push(() =>
    //     window.glApp.stateManager.updateStatusAndResult('pause', 'result')
    // );

    // window.glApp.stateManager.updateStatus(0);
    console.log(window.glApp.stateManager.status);
    console.log(window.glApp.stateManager.result);
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
    window.glApp.stateManager.setRestartAnimation();
}

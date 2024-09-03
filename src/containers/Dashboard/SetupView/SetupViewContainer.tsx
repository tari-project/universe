import useAppStateStore from '@app/store/appStateStore';
import SetupView from './SetupView';

function SetupViewContainer() {
    const setupTitle = useAppStateStore((s) => s.setupTitle);
    const setupProgress = useAppStateStore((s) => s.setupProgress);

    const progressPercentage = Math.floor(setupProgress * 100);

    return <SetupView title={setupTitle} progressPercentage={progressPercentage} />;
}

export default SetupViewContainer;

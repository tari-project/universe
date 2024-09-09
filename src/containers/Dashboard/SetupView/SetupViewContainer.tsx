import { useAppStateStore } from '@app/store/appStateStore';
import SetupView from './SetupView';
import { useShallow } from 'zustand/react/shallow';

function SetupViewContainer() {
    const setupTitle = useAppStateStore(useShallow((s) => s.setupTitle));
    const setupTitleParams = useAppStateStore(useShallow((s) => s.setupTitleParams));
    const setupProgress = useAppStateStore(useShallow((s) => s.setupProgress));

    const progressPercentage = Math.floor(setupProgress * 100);

    return <SetupView title={setupTitle} titleParams={setupTitleParams} progressPercentage={progressPercentage} />;
}

export default SetupViewContainer;

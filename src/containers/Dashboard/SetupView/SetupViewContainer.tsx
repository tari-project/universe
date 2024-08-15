import { useMemo, useState } from 'react';
import useAppStateStore from '../../../store/appStateStore';
import SetupView from './SetupView';
import { useInterval } from '../../../hooks/useInterval.ts';

function SetupViewContainer() {
    const setupTitle = useAppStateStore((s) => s.setupTitle);
    const setupProgress = useAppStateStore((s) => s.setupProgress);

    const [progress, setProgress] = useState(setupProgress);

    useInterval(() => {
        setProgress((c) => (setupProgress - c) * 0.25);
    }, 500);

    const progressPercentage = useMemo(() => Math.floor(progress * 100), [progress]);

    return <SetupView title={setupTitle} progressPercentage={progressPercentage} />;
}

export default SetupViewContainer;

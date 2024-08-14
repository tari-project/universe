import { useEffect, useMemo } from 'react';
import useAppStateStore from '../../../store/appStateStore';
import SetupView from './SetupView';

let latestSetupProgress = 0;

function SetupViewContainer() {
    const { setupTitle, setupProgress } = useAppStateStore((state) => ({
        setupTitle: state.setupTitle,
        setupProgress: state.setupProgress,
    }));
    const progressPercentage = useMemo(
        () => Math.floor(latestSetupProgress * 100),
        []
    );

    useEffect(() => {
        const progressInterval = setInterval(() => {
            latestSetupProgress += (setupProgress - latestSetupProgress) * 0.25;
        }, 500);

        return () => {
            clearInterval(progressInterval);
        };
    }, [setupProgress]);

    return (
        <SetupView title={setupTitle} progressPercentage={progressPercentage} />
    );
}

export default SetupViewContainer;

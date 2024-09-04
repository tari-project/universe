import { useState } from 'react';
import useAppStateStore from '@app/store/appStateStore';
import SetupView from './SetupView';
import { useInterval } from '@app/hooks/useInterval.ts';
import AirdropPermission from '@app/containers/Airdrop/AirdropPermission/AirdropPermission';
import { Wrapper } from './styles';

function SetupViewContainer() {
    const setupTitle = useAppStateStore((s) => s.setupTitle);
    const setupProgress = useAppStateStore((s) => s.setupProgress);

    const [progress, setProgress] = useState(setupProgress || 0);

    useInterval(() => {
        setProgress((c) => (setupProgress + c) * 0.25);
    }, 500);

    const progressPercentage = Math.floor(progress * 100);

    return (
        <Wrapper>
            <SetupView title={setupTitle} progressPercentage={progressPercentage} />
            <AirdropPermission />
        </Wrapper>
    );
}

export default SetupViewContainer;

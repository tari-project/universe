import { useAppStateStore } from '@app/store/appStateStore';
import SetupView from './SetupView';
import { useShallow } from 'zustand/react/shallow';
import AirdropPermission from '@app/containers/Airdrop/AirdropPermission/AirdropPermission';
import { useSetUp } from '@app/hooks/useSetUp';

function SetupViewContainer() {
    const setupTitle = useAppStateStore((s) => s.setupTitle);
    const setupTitleParams = useAppStateStore(useShallow((s) => s.setupTitleParams));
    const setupProgress = useAppStateStore((s) => s.setupProgress);

    const progressPercentage = Math.floor(setupProgress * 100);

    useSetUp();

    return (
        <>
            <SetupView title={setupTitle} titleParams={setupTitleParams} progressPercentage={progressPercentage} />
            <AirdropPermission />
        </>
    );
}

export default SetupViewContainer;

import useAppStateStore from '@app/store/appStateStore';
import SetupView from './SetupView';
import AirdropPermission from '@app/containers/Airdrop/AirdropPermission/AirdropPermission';

function SetupViewContainer() {
    const setupTitle = useAppStateStore((s) => s.setupTitle);
    const setupTitleParams = useAppStateStore((s) => s.setupTitleParams);
    const setupProgress = useAppStateStore((s) => s.setupProgress);

    const progressPercentage = Math.floor(setupProgress * 100);

    return (
        <>
            <SetupView title={setupTitle} titleParams={setupTitleParams} progressPercentage={progressPercentage} />
            <AirdropPermission />
        </>
    );
}

export default SetupViewContainer;

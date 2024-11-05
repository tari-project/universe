import { useSetUp } from '@app/hooks/useSetUp';
import { useAppStateStore } from '@app/store/appStateStore';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import AirdropPermission from '@app/containers/Airdrop/AirdropPermission/AirdropPermission';
import SetupView from './SetupView';

function SetupViewContainer() {
    const setupTitle = useAppStateStore((s) => s.setupTitle);
    const setupTitleParams = useAppStateStore((s) => s.setupTitleParams);
    const setupProgress = useAppStateStore((s) => s.setupProgress);
    const seenPermissions = useAirdropStore((s) => s.seenPermissions);
    const progressPercentage = Math.floor(setupProgress * 100);

    useSetUp();

    return (
        <>
            <SetupView title={setupTitle} titleParams={setupTitleParams} progressPercentage={progressPercentage} />
            {!seenPermissions ? <AirdropPermission /> : null}
        </>
    );
}

export default SetupViewContainer;

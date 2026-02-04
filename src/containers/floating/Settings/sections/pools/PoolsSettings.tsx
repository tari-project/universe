import { CpuPoolsSettings } from './CpuPoolsSettings';
import { GpuPoolsSettings } from './GpuPoolsSettings';
import { useSetupStore } from '@app/store/useSetupStore';
import { setupStoreSelectors } from '@app/store/selectors/setupStoreSelectors';
import { useEffect, useState } from 'react';
import { type as osType } from '@tauri-apps/plugin-os';

export const PoolsSettings = () => {
    const gpuMiningModuleInitialized = useSetupStore(setupStoreSelectors.isGpuMiningModuleInitialized);
    const [isMac, setIsMac] = useState(false);

    useEffect(() => {
        const currentOs = osType();
        if (currentOs) {
            setIsMac(currentOs === 'macos');
        }
    }, []);

    const showGpuSettings = gpuMiningModuleInitialized && !isMac;

    return (
        <>
            <CpuPoolsSettings />
            {showGpuSettings && <GpuPoolsSettings />}
        </>
    );
};

import { CpuPoolsSettings } from './CpuPoolsSettings';
import { GpuPoolsSettings } from './GpuPoolsSettings';

export const PoolsSettings = () => {
    return (
        <>
            <CpuPoolsSettings />
            <GpuPoolsSettings />
        </>
    );
};

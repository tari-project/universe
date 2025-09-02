import { AppModule, AppModuleStatus } from '@app/store/types/setup';
import { IoCheckmarkCircleOutline, IoCloseCircleOutline, IoTimeOutline } from 'react-icons/io5';

export const getModuleName = (module: AppModule) => {
    switch (module) {
        case AppModule.CpuMining:
            return 'setup-progresses:app-modules.cpu-mining';
        case AppModule.GpuMining:
            return 'setup-progresses:app-modules.gpu-mining';
        case AppModule.Wallet:
            return 'setup-progresses:app-modules.wallet';
        default:
            return module;
    }
};

export const getStatusIcon = (status: AppModuleStatus) => {
    switch (status) {
        case AppModuleStatus.Initialized:
            return <IoCheckmarkCircleOutline size={20} style={{ color: '#06C983' }} />;
        case AppModuleStatus.Failed:
            return <IoCloseCircleOutline size={20} style={{ color: '#BF7D11' }} />;
        case AppModuleStatus.Initializing:
            return <IoTimeOutline size={20} style={{ color: '#4D6FE8' }} />;
        default:
            return <IoTimeOutline size={20} style={{ color: '#9CAFF3' }} />;
    }
};

export const getStatusColor = (status: AppModuleStatus) => {
    switch (status) {
        case AppModuleStatus.Initialized:
            return '#06C983';
        case AppModuleStatus.Failed:
            return '#BF7D11';
        case AppModuleStatus.Initializing:
            return '#4D6FE8';
        default:
            return '#9CAFF3';
    }
};

export const getStatusText = (status: AppModuleStatus) => {
    switch (status) {
        case AppModuleStatus.Initialized:
            return 'common:initialized';
        case AppModuleStatus.Failed:
            return 'common:failed';
        case AppModuleStatus.Initializing:
            return 'common:initializing';
        default:
            return 'common:not-initialized';
    }
};

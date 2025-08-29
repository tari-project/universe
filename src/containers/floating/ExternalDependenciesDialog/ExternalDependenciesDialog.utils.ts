import { SystemDependencyStatus } from '@app/types/app-status';

export const mapStatusToText = (status: SystemDependencyStatus) => {
    switch (status) {
        case SystemDependencyStatus.Installed:
            return 'Installed';
        case SystemDependencyStatus.NotInstalled:
            return 'Not installed';
        case SystemDependencyStatus.Unknown:
            return 'Unknown';
    }
};

export const getChipStylingForStatus = (status: SystemDependencyStatus) => {
    switch (status) {
        case SystemDependencyStatus.Installed:
            return { color: 'white', background: 'green' };
        case SystemDependencyStatus.NotInstalled:
            return { color: 'white', background: 'red' };
        case SystemDependencyStatus.Unknown:
            return { color: 'white', background: 'grey' };
    }
};

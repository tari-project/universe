import { ExternalDependencyStatus } from '@app/types/app-status';

export const mapStatusToText = (status: ExternalDependencyStatus) => {
    switch (status) {
        case ExternalDependencyStatus.Installed:
            return 'Installed';
        case ExternalDependencyStatus.NotInstalled:
            return 'Not installed';
        case ExternalDependencyStatus.Unknown:
            return 'Unknown';
    }
};

export const getChipStylingForStatus = (status: ExternalDependencyStatus) => {
    switch (status) {
        case ExternalDependencyStatus.Installed:
            return { color: 'white', background: 'green' };
        case ExternalDependencyStatus.NotInstalled:
            return { color: 'white', background: 'red' };
        case ExternalDependencyStatus.Unknown:
            return { color: 'white', background: 'grey' };
    }
};

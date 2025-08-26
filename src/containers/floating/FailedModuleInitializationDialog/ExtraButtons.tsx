import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { setShowExternalDependenciesDialog, useAppStateStore } from '@app/store';
import { AppModule } from '@app/store/types/setup';
import { SystemDependencyStatus } from '@app/types/app-status';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const GpuMiningModuleMissingPackagesButton = () => {
    const { t } = useTranslation('common', { useSuspense: false });
    const externalDependencies = useAppStateStore((s) => s.systemDependencies);
    const isGpuMiningMissingDependencies = externalDependencies.some(
        (dependency) =>
            dependency.required_by_app_modules.includes(AppModule.GpuMining) &&
            dependency.status === SystemDependencyStatus.NotInstalled
    );
    const handleOpenExternalDependenciesDialog = useCallback(() => {
        setShowExternalDependenciesDialog(true);
    }, []);
    if (!isGpuMiningMissingDependencies) {
        return null;
    }
    return (
        <SquaredButton color="blue" size="small" onClick={handleOpenExternalDependenciesDialog}>
            {t('install_missing_packages')}
        </SquaredButton>
    );
};

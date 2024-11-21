/* eslint-disable i18next/no-literal-string */
import { Button, ButtonGroup, CategoryLabel } from '../styles';
import { useUIStore } from '@app/store/useUIStore';
import { useAppStateStore } from '@app/store/appStateStore';

export function DialogsGroup() {
    const { setCriticalError, criticalError } = useAppStateStore();
    const { setDialogToShow, dialogToShow, showExternalDependenciesDialog, setShowExternalDependenciesDialog } =
        useUIStore();

    return (
        <>
            <CategoryLabel>Dialogs</CategoryLabel>
            <ButtonGroup>
                <Button
                    onClick={() => setCriticalError(criticalError ? undefined : 'This is a critical error')}
                    $isActive={!!criticalError}
                >
                    Critical Error
                </Button>
                <Button
                    onClick={() => setDialogToShow(dialogToShow === 'autoUpdate' ? undefined : 'autoUpdate')}
                    $isActive={dialogToShow === 'autoUpdate'}
                >
                    Auto Update Dialog
                </Button>
                <Button
                    onClick={() => setShowExternalDependenciesDialog(!showExternalDependenciesDialog)}
                    $isActive={showExternalDependenciesDialog}
                >
                    External Dependencies
                </Button>
            </ButtonGroup>
        </>
    );
}

/* eslint-disable i18next/no-literal-string */
import { Button, ButtonGroup, CategoryLabel } from '../styles';

import { useAppStateStore } from '@app/store/appStateStore';
import {
    setCriticalError,
    setCriticalProblem,
    setDialogToShow,
    setShowExternalDependenciesDialog,
} from '@app/store/actions';
import { useUIStore } from '@app/store/useUIStore.ts';

export function DialogsGroup() {
    const { criticalError, criticalProblem } = useAppStateStore((s) => ({
        criticalError: s.criticalError,
        criticalProblem: s.criticalProblem,
    }));
    const { dialogToShow, showExternalDependenciesDialog } = useUIStore((s) => ({
        dialogToShow: s.dialogToShow,
        showExternalDependenciesDialog: s.showExternalDependenciesDialog,
    }));

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
                    onClick={() =>
                        setCriticalProblem(
                            criticalProblem
                                ? undefined
                                : {
                                      title: 'This is a critical problem description',
                                      description: 'This is a critical problem description',
                                  }
                        )
                    }
                    $isActive={!!criticalProblem}
                >
                    Critical Problem
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
                <Button
                    onClick={() => setDialogToShow(dialogToShow === 'releaseNotes' ? undefined : 'releaseNotes')}
                    $isActive={dialogToShow === 'releaseNotes'}
                >
                    Release Notes
                </Button>
                <Button
                    onClick={() =>
                        setDialogToShow(dialogToShow === 'ludicrousConfirmation' ? undefined : 'ludicrousConfirmation')
                    }
                    $isActive={dialogToShow === 'ludicrousConfirmation'}
                >
                    Ludicrous Confirmation
                </Button>
            </ButtonGroup>
        </>
    );
}

/* eslint-disable i18next/no-literal-string */
import { Button, ButtonGroup, CategoryLabel } from '../styles';

import { useAppStateStore } from '@app/store/appStateStore';
import { setCriticalProblem, setDialogToShow, setShowExternalDependenciesDialog } from '@app/store/actions';
import { useUIStore } from '@app/store/useUIStore.ts';

export function DialogsGroup() {
    const criticalProblem = useAppStateStore((s) => s.criticalProblem);
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const showExternalDependenciesDialog = useUIStore((s) => s.showExternalDependenciesDialog);

    return (
        <>
            <CategoryLabel>Dialogs</CategoryLabel>
            <ButtonGroup>
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
                    Auto Update
                </Button>
                <Button
                    onClick={() => setShowExternalDependenciesDialog(!showExternalDependenciesDialog)}
                    $isActive={showExternalDependenciesDialog}
                >
                    External Deps
                </Button>
            </ButtonGroup>
        </>
    );
}

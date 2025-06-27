/* eslint-disable i18next/no-literal-string */
import { AdminButton, ButtonGroup, CategoryLabel } from '../styles';

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
                <AdminButton
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
                </AdminButton>
                <AdminButton
                    onClick={() => setDialogToShow(dialogToShow === 'autoUpdate' ? undefined : 'autoUpdate')}
                    $isActive={dialogToShow === 'autoUpdate'}
                >
                    Auto Update
                </AdminButton>
                <AdminButton
                    onClick={() => setShowExternalDependenciesDialog(!showExternalDependenciesDialog)}
                    $isActive={showExternalDependenciesDialog}
                >
                    External Deps
                </AdminButton>
                <AdminButton
                    onClick={() => setDialogToShow(dialogToShow === 'keychain' ? undefined : 'keychain')}
                    $isActive={dialogToShow === 'keychain'}
                >
                    Keychain Access
                </AdminButton>
                <AdminButton
                    onClick={() => setDialogToShow(dialogToShow === 'pin' ? undefined : 'pin')}
                    $isActive={dialogToShow === 'pin'}
                >
                    Pin Lock
                </AdminButton>
            </ButtonGroup>
        </>
    );
}

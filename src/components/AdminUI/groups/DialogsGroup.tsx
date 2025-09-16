/* eslint-disable i18next/no-literal-string */
import { AdminButton, ButtonGroup } from '../styles';

import { useAppStateStore } from '@app/store/appStateStore';
import { setCriticalProblem, setDialogToShow, setShowExternalDependenciesDialog } from '@app/store/actions';
import { useUIStore } from '@app/store/useUIStore.ts';
import { DialogType } from '@app/store/types/ui.ts';

export function DialogsGroup() {
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const criticalProblem = useAppStateStore((s) => s.criticalProblem);
    const showExternalDependenciesDialog = useUIStore((s) => s.showExternalDependenciesDialog);

    function handleToggle(dialog: DialogType) {
        setDialogToShow(dialogToShow === dialog ? undefined : dialog);
    }

    return (
        <>
            <ButtonGroup>
                <AdminButton
                    onClick={() =>
                        setCriticalProblem(
                            criticalProblem
                                ? undefined
                                : {
                                      title: 'Critical Problem - [Node phase]',
                                      description:
                                          "All modules failed to initialize. App can't work in current state. Please restart the app or contact support.",
                                      error_message:
                                          'This is a critical problem error message: Some Modules failed to initialize.\n [Beep boop] You have a super duper problem 🤖.\n\n Stack trace: "/admin/ui/test/error.rs"\n            "/admin/ui/test/error.rs"\n            "/admin/ui/long_stack_test/error.rs"\n            "/admin/ui/test/error.rs"\n            "/admin/test/error.rs"',
                                  }
                        )
                    }
                    $isActive={!!criticalProblem}
                >
                    Critical Problem
                </AdminButton>
                <AdminButton onClick={() => handleToggle('autoUpdate')} $isActive={dialogToShow === 'autoUpdate'}>
                    Auto Update
                </AdminButton>
                <AdminButton
                    onClick={() => setShowExternalDependenciesDialog(!showExternalDependenciesDialog)}
                    $isActive={showExternalDependenciesDialog}
                >
                    External Deps
                </AdminButton>

                <AdminButton
                    onClick={() => handleToggle('failedModuleInitialization')}
                    $isActive={dialogToShow === 'failedModuleInitialization'}
                >
                    Failed modules
                </AdminButton>
            </ButtonGroup>
        </>
    );
}

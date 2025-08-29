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
                    onClick={() => setDialogToShow(dialogToShow === 'createPin' ? undefined : 'createPin')}
                    $isActive={dialogToShow === 'createPin'}
                >
                    Create Pin
                </AdminButton>
                <AdminButton
                    onClick={() => setDialogToShow(dialogToShow === 'enterPin' ? undefined : 'enterPin')}
                    $isActive={dialogToShow === 'enterPin'}
                >
                    Enter Pin
                </AdminButton>
                <AdminButton
                    onClick={() => setDialogToShow(dialogToShow === 'forgotPin' ? undefined : 'forgotPin')}
                    $isActive={dialogToShow === 'forgotPin'}
                >
                    Forgot Pin
                </AdminButton>
            </ButtonGroup>
        </>
    );
}

/* eslint-disable i18next/no-literal-string */
import { Button, ButtonGroup, CategoryLabel } from '../styles';

import { useAppStateStore } from '@app/store/appStateStore';
import { setCriticalProblem, setDialogToShow, setShowExternalDependenciesDialog } from '@app/store/actions';
import { useUIStore } from '@app/store/useUIStore.ts';
import { setShowExchangeModal, setShowUniversalModal, useExchangeStore } from '@app/store/useExchangeStore.ts';

export function DialogsGroup() {
    const criticalProblem = useAppStateStore((s) => s.criticalProblem);
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const showExternalDependenciesDialog = useUIStore((s) => s.showExternalDependenciesDialog);
    const showExchangeModal = useExchangeStore((s) => s.showExchangeAddressModal);
    const showUniversalModal = useExchangeStore((s) => s.showUniversalModal);

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
                <Button onClick={() => setShowExchangeModal(!showExchangeModal)}>Test Exchange Modal</Button>
                <Button onClick={() => setShowUniversalModal(!showUniversalModal)}>Test Universal Modal</Button>

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
                    Ludicrous
                </Button>
            </ButtonGroup>
        </>
    );
}

import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Typography } from '@app/components/elements/Typography';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Checkbox } from '@app/components/elements/inputs/Checkbox';
import { useUIStore } from '@app/store/useUIStore';
import { toggleTaskTrayMode, setCloseExperienceSelected } from '@app/store/actions/appConfigStoreActions';

import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrapper, TextWrapper, ButtonSectionWrapper, ButtonsWrapper, CheckboxWrapper } from './styles.ts';
import { setIsCloseInfoModalShown, setShowCloseInfoModal } from '@app/store/actions/uiStoreActions.ts';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';

const CloseExperienceDialog = memo(function CloseExperienceDialog() {
    const { t } = useTranslation(['common'], { useSuspense: false });
    const isOpen = useUIStore((s) => s.showCloseInfoModal);
    const [dontAskAgain, setDontAskAgain] = useState(false);

    const handleRunInBackground = useCallback(async () => {
        try {
            await toggleTaskTrayMode(true);
            if (dontAskAgain) {
                await setCloseExperienceSelected(true);
            }
            setIsCloseInfoModalShown(true);

            await invoke('hide_to_tray');
            await invoke('mark_shutdown_information_dialog_as_shown');
            setShowCloseInfoModal(false);
        } catch (error) {
            console.error('Failed to set run in background mode:', error);
        }
    }, [dontAskAgain]);

    const handleExitCompletely = useCallback(async () => {
        try {
            await toggleTaskTrayMode(false);

            if (dontAskAgain) {
                await setCloseExperienceSelected(true);
            }
            setIsCloseInfoModalShown(true);
            await invoke('mark_shutdown_information_dialog_as_shown');

            setShowCloseInfoModal(false);

            const appWindow = getCurrentWindow();
            appWindow.close();
        } catch (error) {
            console.error('Failed to set exit completely mode:', error);
        }
    }, [dontAskAgain]);

    const handleDontAskAgainChange = useCallback((checked: boolean) => {
        setDontAskAgain(checked);
    }, []);

    return (
        <Dialog open={isOpen}>
            <DialogContent>
                <Wrapper>
                    <TextWrapper>
                        <Typography variant="h3">{t('close-experience-dialog.title')}</Typography>
                        <Typography variant="p">{t('close-experience-dialog.description')}</Typography>
                    </TextWrapper>

                    <ButtonSectionWrapper>
                        <ButtonsWrapper>
                            <Button fluid size="small" onClick={handleRunInBackground} backgroundColor="green">
                                {t('close-experience-dialog.run-in-background', 'Run in Background')}
                            </Button>
                            <Button fluid size="small" onClick={handleExitCompletely} backgroundColor="warning">
                                {t('close-experience-dialog.exit-completely', 'Exit Completely')}
                            </Button>
                        </ButtonsWrapper>

                        <CheckboxWrapper>
                            <Checkbox
                                id="dont-ask-again-checkbox"
                                checked={dontAskAgain}
                                handleChange={handleDontAskAgainChange}
                                labelText={t('close-experience-dialog.dont-ask-again', "Don't ask me again")}
                            />
                        </CheckboxWrapper>
                    </ButtonSectionWrapper>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
});

export default CloseExperienceDialog;

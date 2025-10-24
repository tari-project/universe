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

const CloseExperienceDialog = memo(function CloseExperienceDialog() {
    const { t } = useTranslation(['common'], { useSuspense: false });
    const isOpen = useUIStore((s) => s.showCloseInfoModal);
    const [dontAskAgain, setDontAskAgain] = useState(false);

    const handleClose = useCallback(() => {
        setIsCloseInfoModalShown(true);

        const appWindow = getCurrentWindow();
        appWindow.close();

        setShowCloseInfoModal(false);
    }, []);

    const handleRunInBackground = useCallback(async () => {
        try {
            await toggleTaskTrayMode(true);
            if (dontAskAgain) {
                await setCloseExperienceSelected(true);
            }
            handleClose();
        } catch (error) {
            console.error('Failed to set run in background mode:', error);
        }
    }, [dontAskAgain, handleClose]);

    const handleExitCompletely = useCallback(async () => {
        console.info('Exit completely selected');
        try {
            console.info('Exit completely selected');
            await toggleTaskTrayMode(false);
            console.info('Toggled task tray mode to false');
            if (dontAskAgain) {
                console.info('Setting close experience selected to true');
                await setCloseExperienceSelected(true);
            }
            console.info('Proceeding to close the dialog');
            handleClose();
        } catch (error) {
            console.error('Failed to set exit completely mode:', error);
        }
    }, [dontAskAgain, handleClose]);

    const handleDontAskAgainChange = useCallback((checked: boolean) => {
        setDontAskAgain(checked);
    }, []);

    return (
        <Dialog open={isOpen}>
            <DialogContent>
                <Wrapper>
                    <TextWrapper>
                        <Typography variant="h3">
                            {t('close-experience-title', 'Choose how to close Tari Universe')}
                        </Typography>
                        <Typography variant="p">
                            {t(
                                'close-experience-description',
                                'You can either minimize the app to system tray to keep mining in the background, or exit completely to stop all processes.'
                            )}
                        </Typography>
                    </TextWrapper>

                    <ButtonSectionWrapper>
                        <ButtonsWrapper>
                            <Button fluid size="small" onClick={handleRunInBackground} backgroundColor="green">
                                {t('run-in-background', 'Run in Background')}
                            </Button>
                            <Button fluid size="small" onClick={handleExitCompletely} backgroundColor="warning">
                                {t('exit-completely', 'Exit Completely')}
                            </Button>
                        </ButtonsWrapper>

                        <CheckboxWrapper>
                            <Checkbox
                                id="dont-ask-again-checkbox"
                                checked={dontAskAgain}
                                handleChange={handleDontAskAgainChange}
                                labelText={t('dont-ask-again', "Don't ask me again")}
                            />
                        </CheckboxWrapper>
                    </ButtonSectionWrapper>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
});

export default CloseExperienceDialog;

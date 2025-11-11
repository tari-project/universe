import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ShutdownMode } from '@app/types/config/core.ts';
import { useUIStore } from '@app/store/useUIStore';
import { markShutdownModeAsSelected } from '@app/store/actions/appConfigStoreActions';
import { setShowShutdownSelectionModal } from '@app/store/actions/uiStoreActions.ts';
import { updateShutdownMode } from '@app/store/actions/config/core.ts';

import { Checkbox } from '@app/components/elements/inputs/Checkbox';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Typography } from '@app/components/elements/Typography';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Wrapper, TextWrapper, ButtonSectionWrapper, ButtonsWrapper, CheckboxWrapper } from './styles.ts';

const ShutdownSelectionDialog = memo(function CloseExperienceDialog() {
    const { t } = useTranslation(['components'], { useSuspense: false });
    const isShutdownSelectionModalOpen = useUIStore((s) => s.showShutdownSelectionModal);
    const [dontAskAgain, setDontAskAgain] = useState(false);

    const handleClose = useCallback(async () => {
        await markShutdownModeAsSelected(dontAskAgain);
        setShowShutdownSelectionModal(false);
    }, [dontAskAgain]);

    const handleRunInBackground = useCallback(async () => {
        try {
            await updateShutdownMode(ShutdownMode.Tasktray);
            await handleClose();
        } catch (error) {
            console.error('Failed to set run in background mode:', error);
        }
    }, [handleClose]);

    const handleExitCompletely = useCallback(async () => {
        try {
            await updateShutdownMode(ShutdownMode.Direct);
            await handleClose();
        } catch (error) {
            console.error('Failed to set exit completely mode:', error);
        }
    }, [handleClose]);

    return (
        <Dialog open={isShutdownSelectionModalOpen}>
            <DialogContent>
                <Wrapper>
                    <TextWrapper>
                        <Typography variant="h3">{t('close-experience-dialog.title')}</Typography>
                        <Typography variant="p">{t('close-experience-dialog.description')}</Typography>
                    </TextWrapper>

                    <ButtonSectionWrapper>
                        <ButtonsWrapper>
                            <Button fluid size="small" onClick={handleRunInBackground} backgroundColor="green">
                                {t('close-experience-dialog.run-in-background')}
                            </Button>
                            <Button fluid size="small" onClick={handleExitCompletely} backgroundColor="warning">
                                {t('close-experience-dialog.exit-completely')}
                            </Button>
                        </ButtonsWrapper>

                        <CheckboxWrapper>
                            <Checkbox
                                id="dont-ask-again-checkbox"
                                checked={dontAskAgain}
                                handleChange={setDontAskAgain}
                                labelText={t('close-experience-dialog.dont-ask-again')}
                            />
                        </CheckboxWrapper>
                    </ButtonSectionWrapper>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
});

export default ShutdownSelectionDialog;

import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Typography } from '@app/components/elements/Typography';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { useUIStore } from '@app/store/useUIStore';
import { setShowBatteryAlert } from '@app/store/actions/uiStoreActions';

import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrapper, TextWrapper, ButtonWrapper } from './styles';

const BatteryAlertDialog = memo(function BatteryAlertDialog() {
    const { t } = useTranslation(['components'], { useSuspense: false });
    const isOpen = useUIStore((s) => s.showBatteryAlert);

    const handleClose = useCallback(() => {
        setShowBatteryAlert(false);
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <Wrapper>
                    <TextWrapper>
                        <Typography variant="h3">{t('battery-alert-dialog.title')}</Typography>
                        <Typography variant="p">{t('battery-alert-dialog.description')}</Typography>
                    </TextWrapper>

                    <ButtonWrapper>
                        <Button fluid size="small" onClick={handleClose}>
                            {t('battery-alert-dialog.understood')}
                        </Button>
                    </ButtonWrapper>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
});

export default BatteryAlertDialog;

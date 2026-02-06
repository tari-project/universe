import { useTranslation } from 'react-i18next';
import { setShowConfirmLocation, useModalStore } from '@app/store/stores/useModalStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Content, CTAWrapper, StyledCTA, Wrapper } from './styles.ts';
import alertEmoji from '/assets/img/icons/emoji/alert_emoji.png';
import { setMoveDataConfirmed } from '@app/store';

export default function ConfirnNodeDataLocation() {
    const { t } = useTranslation('settings');
    const showConfirmLocation = useModalStore((s) => s.showConfirmLocation);

    function handleClose() {
        setShowConfirmLocation(false);
        setMoveDataConfirmed(false);
    }
    function handleConfirm() {
        setMoveDataConfirmed(true);
    }
    return (
        <Dialog open={showConfirmLocation} onOpenChange={setShowConfirmLocation} disableClose>
            <DialogContent>
                <Wrapper>
                    <Typography variant="h3">{t('node.confirm-title')}</Typography>
                    <Content>
                        <img src={alertEmoji} alt="Alert Emoji Icon" />
                        <Typography>{t('node.confirm-warning')}</Typography>
                    </Content>
                    <CTAWrapper>
                        <StyledCTA onClick={handleClose}>{t('cancel')}</StyledCTA>
                        <StyledCTA backgroundColor="green" onClick={handleConfirm}>
                            {t('Confirm')}
                        </StyledCTA>
                    </CTAWrapper>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}

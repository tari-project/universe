import { useTranslation } from 'react-i18next';
import { setShowConfirmLocation, useModalStore } from '@app/store/stores/useModalStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Content, CTAWrapper, StyledCTA, Wrapper } from './styles.ts';
import alertEmoji from '/assets/img/icons/emoji/alert_emoji.png';

export default function ConfirnNodeDataLocation() {
    const { t } = useTranslation('settings');
    const showConfirmLocation = useModalStore((s) => s.showConfirmLocation);
    return (
        <Dialog open={showConfirmLocation} onOpenChange={setShowConfirmLocation} disableClose>
            <DialogContent>
                <Wrapper>
                    <Typography variant="h3">{t('Confirm node data location change')}</Typography>
                    <Content>
                        <img src={alertEmoji} alt="Alert Emoji Icon" />
                        <Typography>
                            {t(
                                `Moving your base node location could result in losing your existing chain data. If this happens you will have to resync.`
                            )}
                        </Typography>
                    </Content>
                    <CTAWrapper>
                        <StyledCTA>{t('cancel')}</StyledCTA>
                        <StyledCTA backgroundColor="green">{t('Confirm')}</StyledCTA>
                    </CTAWrapper>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}

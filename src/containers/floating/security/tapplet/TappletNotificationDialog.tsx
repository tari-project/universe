import { useSecurityStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Content, ContentWrapper, CTAWrapper, Header, Subtitle, Title, Wrapper } from '../common.styles.ts';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { useTranslation } from 'react-i18next';
import { emit } from '@tauri-apps/api/event';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { TextWrapper } from '@app/components/sync/styles.ts';

export default function TappletNotificationDialog() {
    const { t } = useTranslation('staged-security');
    const modal = useSecurityStore((s) => s.modal);
    const setModal = useSecurityStore((s) => s.setModal);
    const setTappletNotification = useSecurityStore((s) => s.setTappletNotification);
    const notification = useSecurityStore((s) => s.tappletNotification);

    const isOpen = modal === 'tapplet_notofication';

    function handleClose() {
        void emit('tapplet-dialog-response', undefined);
        setModal(null);
        setTappletNotification('');
    }

    function handleSubmit() {
        emit('tapplet-dialog-response', notification).finally(() => {
            setModal(null);
            setTappletNotification('');
        });
    }

    // TODO add translations, designs and style
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent $transparentBg $unPadded>
                <Wrapper>
                    <Header>
                        <CloseButton onClick={handleClose} />
                    </Header>
                    <Content>
                        <Title>{'Tapplet notification'}</Title>
                        <ContentWrapper>
                            <TextWrapper>{notification}</TextWrapper>
                        </ContentWrapper>

                        <CTAWrapper>
                            <Button
                                onClick={handleSubmit}
                                variant="black"
                                fluid
                                size="xlarge"
                                disabled={!notification}
                                type="submit"
                            >
                                {t('Accept')}
                            </Button>
                            <TextButton color="greyscale" onClick={handleClose}>
                                {'Reject'}
                            </TextButton>
                        </CTAWrapper>
                    </Content>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
